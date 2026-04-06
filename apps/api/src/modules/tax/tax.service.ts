import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  ColombiaTaxEngineAG2026,
  TaxProfileInput,
  IncomeStreamInput,
  applyTaxLeverSelection,
  computeOptimizedTaxSnapshot,
  calculateColombiaIncomeTaxUVT2026,
} from '@personal-finance-os/tax-engine';

@Injectable()
export class TaxService {
  private readonly engine = new ColombiaTaxEngineAG2026();

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.taxProfile.findFirst({
      where: { userId },
      orderBy: [{ taxYear: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  private normalizeProfilePayload(payload: Record<string, unknown>) {
    const taxYear =
      typeof payload.taxYear === 'number'
        ? payload.taxYear
        : Number(payload.taxYear) || new Date().getFullYear();
    const jurisdiction =
      typeof payload.jurisdiction === 'string' ? payload.jurisdiction : 'CO';
    return {
      taxYear,
      jurisdiction,
      isResident: payload.isResident !== false,
      daysInCountry: Math.min(
        366,
        Math.max(0, Number(payload.daysInCountry ?? 365)),
      ),
      primaryNationality:
        typeof payload.primaryNationality === 'string'
          ? payload.primaryNationality
          : 'CO',
      hasForeignIncome: Boolean(payload.hasForeignIncome),
      hasForeignAssets: Boolean(payload.hasForeignAssets),
      hasDependents: Boolean(payload.hasDependents),
      hasVoluntaryPension: Boolean(payload.hasVoluntaryPension),
      hasAFC: Boolean(payload.hasAFC),
      hasPrepaidMedicine: Boolean(payload.hasPrepaidMedicine),
      hasHousingInterest: Boolean(payload.hasHousingInterest),
    };
  }

  async saveProfile(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    if (!userId) {
      throw new BadRequestException('Missing authenticated user');
    }
    const n = this.normalizeProfilePayload(payload);

    return this.prisma.taxProfile.upsert({
      where: {
        userId_taxYear_jurisdiction: {
          userId,
          taxYear: n.taxYear,
          jurisdiction: n.jurisdiction,
        },
      },
      create: {
        userId,
        taxYear: n.taxYear,
        jurisdiction: n.jurisdiction,
        isResident: n.isResident,
        daysInCountry: n.daysInCountry,
        primaryNationality: n.primaryNationality,
        hasForeignIncome: n.hasForeignIncome,
        hasForeignAssets: n.hasForeignAssets,
        hasDependents: n.hasDependents,
        hasVoluntaryPension: n.hasVoluntaryPension,
        hasAFC: n.hasAFC,
        hasPrepaidMedicine: n.hasPrepaidMedicine,
        hasHousingInterest: n.hasHousingInterest,
      },
      update: {
        isResident: n.isResident,
        daysInCountry: n.daysInCountry,
        primaryNationality: n.primaryNationality,
        hasForeignIncome: n.hasForeignIncome,
        hasForeignAssets: n.hasForeignAssets,
        hasDependents: n.hasDependents,
        hasVoluntaryPension: n.hasVoluntaryPension,
        hasAFC: n.hasAFC,
        hasPrepaidMedicine: n.hasPrepaidMedicine,
        hasHousingInterest: n.hasHousingInterest,
      },
    });
  }

  /** Guarda perfil y ejecuta el motor en la misma operación (evita carreras entre dos POST). */
  async saveProfileAndAnalyze(userId: string, body: Record<string, unknown>) {
    await this.saveProfile({ ...body, userId });
    return this.analyzeTaxSituation(userId);
  }

  async analyzeTaxSituation(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new NotFoundException(
        'No hay perfil fiscal. Guarda primero tu perfil en la pestaña correspondiente.',
      );
    }

    const profileInput: TaxProfileInput = {
      isResident: profile.isResident,
      daysInCountry: profile.daysInCountry,
      primaryNationality: profile.primaryNationality,
      hasForeignIncome: profile.hasForeignIncome,
      hasDependents: profile.hasDependents,
      hasVoluntaryPension: profile.hasVoluntaryPension,
      hasAFC: profile.hasAFC,
      hasPrepaidMedicine: profile.hasPrepaidMedicine,
      hasHousingInterest: profile.hasHousingInterest,
    };

    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId, flowType: 'INCOME' },
    });

    const incomeStreams: IncomeStreamInput[] = streams.map((s) => ({
      id: s.id,
      amount: Number(s.expectedAmount) * 12,
      sourceCountry:
        s.currency === 'USD' || s.currency === 'EUR' ? 'FOREIGN' : 'CO',
      currency: s.currency,
      type: s.streamType as 'FIXED' | 'VARIABLE',
      contractType: s.currency === 'USD' ? 'FOREIGN_CONTRACTOR' : 'LABOR',
      hasSubordination: s.currency !== 'USD',
    }));

    const classifications = incomeStreams.map((stream) =>
      this.engine.classifyIncome(stream, profileInput),
    );

    for (const c of classifications) {
      const existing = await this.prisma.taxIncomeClassification.findFirst({
        where: { profileId: profile.id, referenceId: c.referenceId },
      });
      const data = {
        suggestedCedula: c.suggestedCedula,
        confidenceLevel: c.confidenceLevel,
        isForeignSource: c.isForeignSource,
        hasWithholding: false,
        foreignTaxPaid: Number(c.foreignTaxPaid) || 0,
        engineVersion: this.engine.version,
        explanation: c.explanation,
        missingConditions: c.missingConditions,
      };
      if (existing) {
        await this.prisma.taxIncomeClassification.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await this.prisma.taxIncomeClassification.create({
          data: {
            profileId: profile.id,
            referenceId: c.referenceId,
            referenceType: 'CASHFLOW',
            ...data,
          },
        });
      }
    }

    const scenarios = this.engine.generateScenarios(
      profileInput,
      classifications,
    );

    const plan = await this.prisma.taxPlan.create({
      data: { profileId: profile.id },
    });

    for (const sc of scenarios) {
      await this.prisma.taxScenario.create({
        data: {
          planId: plan.id,
          name: sc.name,
          type: sc.type,
          estimatedGrossIncome: sc.estimatedGrossIncome,
          estimatedDeductions: sc.estimatedDeductions,
          estimatedExemptions: sc.estimatedExemptions,
          estimatedTaxableBase: sc.estimatedTaxableBase,
          estimatedTaxLiability: sc.estimatedTaxLiability,
          estimatedForeignCredit: sc.estimatedForeignCredit,
          estimatedNetTaxPayable: sc.estimatedNetTaxPayable,
          explanation: sc.explanation,
          riskLevel: sc.riskLevel,
          requirements: sc.requirements,
        },
      });
    }

    return {
      profile,
      classifications,
      scenarios,
    };
  }

  async getClassifications(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) return [];

    const classifications =
      await this.prisma.taxIncomeClassification.findMany({
        where: { profileId: profile.id },
      });

    const ids = classifications.map((c) => c.referenceId);
    const streams =
      ids.length === 0
        ? []
        : await this.prisma.cashflowStream.findMany({
            where: { id: { in: ids } },
          });

    return classifications.map((c) => ({
      ...c,
      stream: streams.find((s) => s.id === c.referenceId) ?? null,
    }));
  }

  async getLatestPlan(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) return null;

    const latestPlan = await this.prisma.taxPlan.findFirst({
      where: { profileId: profile.id },
      orderBy: { generatedAt: 'desc' },
      include: { scenarios: true },
    });

    if (!latestPlan) return null;
    return { ...latestPlan, scenarios: latestPlan.scenarios };
  }

  /**
   * Proyección declaración de renta: comparación por palanca + si aplica vista “contribuyente establecido”.
   */
  async getDeclarationInsights(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) return null;

    const profileInput: TaxProfileInput = {
      isResident: profile.isResident,
      daysInCountry: profile.daysInCountry,
      primaryNationality: profile.primaryNationality,
      hasForeignIncome: profile.hasForeignIncome,
      hasDependents: profile.hasDependents,
      hasVoluntaryPension: profile.hasVoluntaryPension,
      hasAFC: profile.hasAFC,
      hasPrepaidMedicine: profile.hasPrepaidMedicine,
      hasHousingInterest: profile.hasHousingInterest,
    };

    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId, flowType: 'INCOME' },
    });

    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    const threshold = Date.now() - oneYearMs;
    const hasEstablishedIncome = streams.some(
      (s) => new Date(s.startDate).getTime() <= threshold,
    );

    const incomeStreams: IncomeStreamInput[] = streams.map((s) => ({
      id: s.id,
      amount: Number(s.expectedAmount) * 12,
      sourceCountry:
        s.currency === 'USD' || s.currency === 'EUR' ? 'FOREIGN' : 'CO',
      currency: s.currency,
      type: s.streamType as 'FIXED' | 'VARIABLE',
      contractType: s.currency === 'USD' ? 'FOREIGN_CONTRACTOR' : 'LABOR',
      hasSubordination: s.currency !== 'USD',
    }));

    const classifications = incomeStreams.map((stream) =>
      this.engine.classifyIncome(stream, profileInput),
    );

    const totalAnnual = incomeStreams.reduce((a, s) => a + s.amount, 0);
    let leverComparison = this.engine.compareLeverScenarios(
      profileInput,
      classifications,
    );

    /** Sin ingresos en Cashflow el motor devuelve []; igual mostramos tarjeta + gráfico en cero. */
    if (leverComparison.length === 0) {
      leverComparison = [
        {
          id: 'CONSERVATIVE',
          label: 'Conservador (sin deducciones)',
          description:
            'Registra ingresos en Cashflow para estimar el impuesto sobre la base bruta.',
          estimatedGrossIncome: 0,
          estimatedTaxableBase: 0,
          estimatedNetTaxPayable: 0,
          savingsVsConservative: 0,
        },
        {
          id: 'OPTIMIZED_ACTUAL',
          label: 'Tu perfil combinado',
          description:
            'Con ingresos y beneficios marcados en tu perfil, verás aquí la proyección optimizada.',
          estimatedGrossIncome: 0,
          estimatedTaxableBase: 0,
          estimatedNetTaxPayable: 0,
          savingsVsConservative: 0,
        },
      ];
    }

    const UVT_2026 = 48000;
    const approxFilingThresholdUvt = 1400;
    const exceedsMassThreshold =
      totalAnnual >= approxFilingThresholdUvt * UVT_2026;

    /** Siempre que exista perfil fiscal guardado, mostrar bloque de proyección en la web. */
    const showDeclarationModule = true;

    return {
      showDeclarationModule,
      hasEstablishedIncome,
      exceedsMassThreshold,
      totalAnnualIncomeEstimated: totalAnnual,
      engineVersion: this.engine.version,
      leverComparison,
    };
  }

  /**
   * Impuesto estimado si activaras **a la vez** las palancas indicadas (sobre base sin otros beneficios),
   * respetando topes del motor (40% / 1340 UVT, etc.).
   */
  async previewLeverCombination(userId: string, leverIds: string[]) {
    const profile = await this.getProfile(userId);
    if (!profile) return null;

    const unique = [...new Set(leverIds)].filter(Boolean);
    if (unique.length === 0) return null;

    const profileInput: TaxProfileInput = {
      isResident: profile.isResident,
      daysInCountry: profile.daysInCountry,
      primaryNationality: profile.primaryNationality,
      hasForeignIncome: profile.hasForeignIncome,
      hasDependents: profile.hasDependents,
      hasVoluntaryPension: profile.hasVoluntaryPension,
      hasAFC: profile.hasAFC,
      hasPrepaidMedicine: profile.hasPrepaidMedicine,
      hasHousingInterest: profile.hasHousingInterest,
    };

    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId, flowType: 'INCOME' },
    });

    const incomeStreams: IncomeStreamInput[] = streams.map((s) => ({
      id: s.id,
      amount: Number(s.expectedAmount) * 12,
      sourceCountry:
        s.currency === 'USD' || s.currency === 'EUR' ? 'FOREIGN' : 'CO',
      currency: s.currency,
      type: s.streamType as 'FIXED' | 'VARIABLE',
      contractType: s.currency === 'USD' ? 'FOREIGN_CONTRACTOR' : 'LABOR',
      hasSubordination: s.currency !== 'USD',
    }));

    const classifications = incomeStreams.map((stream) =>
      this.engine.classifyIncome(stream, profileInput),
    );
    const totalAnnual = incomeStreams.reduce((a, s) => a + s.amount, 0);
    const foreignTaxes = classifications.reduce(
      (a, c) => a + (c.foreignTaxPaid || 0),
      0,
    );

    const patched = applyTaxLeverSelection(profileInput, unique);
    const snap = computeOptimizedTaxSnapshot(
      patched,
      totalAnnual,
      foreignTaxes,
    );
    const conservativeTax = calculateColombiaIncomeTaxUVT2026(totalAnnual);

    return {
      leverIds: unique,
      estimatedGrossIncome: totalAnnual,
      estimatedTaxableBase: snap.taxableBase,
      estimatedNetTaxPayable: snap.netPayable,
      savingsVsConservative: Math.max(0, conservativeTax - snap.netPayable),
      label:
        unique.length === 1
          ? 'Combinación: 1 beneficio'
          : `Combinación: ${unique.length} beneficios`,
    };
  }
}
