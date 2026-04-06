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
  computeOptimizedTaxSnapshotWithExplanation,
  calculateColombiaIncomeTaxUVT2026,
  CO_AG2026_NORMATIVE_REFS,
} from '@personal-finance-os/tax-engine';
import {
  createNode,
  emptyFinancialExplanation,
  mergeFinancialExplanations,
  type FinancialExplanation,
} from '@personal-finance-os/explanation';
import { augmentTaxExplanation } from '../../common/explanation/tax-context';
import { ConfidenceService } from '../confidence/confidence.service';

@Injectable()
export class TaxService {
  private readonly engine = new ColombiaTaxEngineAG2026();

  constructor(
    private readonly prisma: PrismaService,
    private readonly confidenceService: ConfidenceService,
  ) {}

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

    const totalIncome = classifications.reduce(
      (a, c) => a + (c.annualGrossAmount ?? 0),
      0,
    );
    const foreignTaxes = classifications.reduce(
      (a, c) => a + (c.foreignTaxPaid || 0),
      0,
    );
    const { explanation: coreExpl } = computeOptimizedTaxSnapshotWithExplanation(
      profileInput,
      totalIncome,
      foreignTaxes,
    );
    const explanation = augmentTaxExplanation(coreExpl, {
      incomeStreamCount: incomeStreams.length,
      engineVersion: this.engine.version,
      missingConditions: [
        ...new Set(classifications.flatMap((c) => c.missingConditions)),
      ],
      extraAssumptions: [
        'Escenarios “conservador” y “optimizado” se generan con el mismo ingreso clasificado.',
      ],
    });

    const confidence = await this.confidenceService.evaluateTax(userId);

    return {
      profile,
      classifications,
      scenarios,
      explanation,
      confidence,
    };
  }

  async getClassifications(userId: string) {
    const confidence = await this.confidenceService.evaluateTax(userId);
    const profile = await this.getProfile(userId);
    if (!profile) {
      return {
        classifications: [] as Array<Record<string, unknown>>,
        explanation: emptyFinancialExplanation(
          'tax.co.classifications',
          'Clasificación tributaria de ingresos',
        ),
        confidence,
      };
    }

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

    const items = classifications.map((c) => ({
      ...c,
      stream: streams.find((s) => s.id === c.referenceId) ?? null,
    }));

    const missing = [
      ...new Set(
        items.flatMap(
          (c) => (c.missingConditions as string[] | null | undefined) ?? [],
        ),
      ),
    ];

    const explanation: FinancialExplanation = {
      ...emptyFinancialExplanation(
        'tax.co.classifications',
        'Clasificación tributaria de ingresos',
      ),
      summary:
        'Cada flujo de Cashflow se asocia a una cédula tentativa según moneda, contrato y residencia.',
      inputs: [
        createNode({
          kind: 'input',
          label: 'Clasificaciones persistidas',
          value: items.length,
          meta: { engineVersion: this.engine.version },
        }),
      ],
      steps: items.map((c) =>
        createNode({
          kind: 'rule',
          label: `Ingreso → ${c.suggestedCedula}`,
          description: (c.explanation as string) || undefined,
          meta: {
            confidenceLevel: c.confidenceLevel,
            referenceId: c.referenceId,
          },
        }),
      ),
      assumptions: [
        'Heurística del motor CO-AG2026; no sustituye análisis de un contador.',
        'Streams en USD se modelan como contrato extranjero sin subordinación salvo ajuste manual futuro.',
      ],
      missingData: missing,
      normativeRefs: [...CO_AG2026_NORMATIVE_REFS],
    };

    return { classifications: items, explanation, confidence };
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

    const confidence = await this.confidenceService.evaluateTax(userId);

    const explanation: FinancialExplanation = {
      ...emptyFinancialExplanation(
        'tax.co.plan_latest',
        'Plan fiscal almacenado',
      ),
      summary: `Plan generado con ${latestPlan.scenarios.length} escenario(s).`,
      inputs: [
        createNode({
          kind: 'input',
          label: 'Fecha de generación',
          description: latestPlan.generatedAt.toISOString(),
        }),
      ],
      steps: latestPlan.scenarios.map((s) =>
        createNode({
          kind: 'result',
          label: s.name,
          description: s.explanation ?? undefined,
          value: Number(s.estimatedNetTaxPayable),
        }),
      ),
      assumptions: [
        'Cifras congeladas al ejecutar “Recalcular Motor”; cambios en Cashflow no actualizan este plan hasta un nuevo análisis.',
      ],
      missingData: [],
      normativeRefs: [...CO_AG2026_NORMATIVE_REFS],
    };

    return {
      ...latestPlan,
      scenarios: latestPlan.scenarios,
      explanation,
      confidence,
    };
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

    const foreignTaxes = classifications.reduce(
      (a, c) => a + (c.foreignTaxPaid || 0),
      0,
    );
    const { explanation: coreDeclExpl } = computeOptimizedTaxSnapshotWithExplanation(
      profileInput,
      totalAnnual,
      foreignTaxes,
    );
    const explanation = augmentTaxExplanation(coreDeclExpl, {
      incomeStreamCount: streams.length,
      engineVersion: this.engine.version,
      missingConditions: [
        ...new Set(classifications.flatMap((c) => c.missingConditions)),
      ],
      extraAssumptions: [
        'Comparación por palanca: cada fila recalcula el motor con un subconjunto de beneficios.',
        `Umbral ingreso “establecido”: stream con antigüedad > 365 días.`,
        `Umbral filing orientativo: ingreso ≥ ${approxFilingThresholdUvt} UVT × ${UVT_2026} COP/UVT.`,
      ],
    });

    const confidence = await this.confidenceService.evaluateTax(userId);

    return {
      showDeclarationModule,
      hasEstablishedIncome,
      exceedsMassThreshold,
      totalAnnualIncomeEstimated: totalAnnual,
      engineVersion: this.engine.version,
      leverComparison,
      explanation,
      confidence,
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
    const { snapshot: snap, explanation: corePreviewExpl } =
      computeOptimizedTaxSnapshotWithExplanation(
        patched,
        totalAnnual,
        foreignTaxes,
      );
    const conservativeTax = calculateColombiaIncomeTaxUVT2026(totalAnnual);

    const explanation = mergeFinancialExplanations(corePreviewExpl, {
      assumptions: [
        `Palancas simuladas (combinación): ${unique.join(', ')}.`,
        'Resto de beneficios en cero salvo datos de residencia del perfil (applyTaxLeverSelection).',
      ],
    });

    const confidence = await this.confidenceService.evaluateTax(userId);

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
      explanation,
      confidence,
    };
  }
}
