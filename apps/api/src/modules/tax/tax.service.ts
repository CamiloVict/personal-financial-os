import { createHash } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  ColombiaTaxEngineAG2026,
  TaxProfileInput,
  IncomeStreamInput,
  applyTaxLeverSelection,
  computeOptimizedTaxSnapshotWithExplanation,
  calculateColombiaIncomeTaxUVT2026,
  CO_AG2026_NORMATIVE_REFS,
  normalizeFinancialDataForTax,
  UVT_2026,
  type NormalizedTaxFinancials,
} from '@personal-finance-os/tax-engine';
import {
  buildTaxCalculationAuditPayload,
  createNode,
  emptyFinancialExplanation,
  mergeFinancialExplanations,
  type FinancialExplanation,
} from '@personal-finance-os/explanation';
import { augmentTaxExplanation } from '../../common/explanation/tax-context';
import { ConfidenceService } from '../confidence/confidence.service';

export type TaxCalculationAuditKind =
  | 'PLAN_RECALC'
  | 'DECLARATION_INSIGHTS'
  | 'LEVER_PREVIEW';

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);
  private readonly engine = new ColombiaTaxEngineAG2026();

  constructor(
    private readonly prisma: PrismaService,
    private readonly confidenceService: ConfidenceService,
  ) {}

  private stableJsonStringify(obj: unknown): string {
    const sort = (v: unknown): unknown => {
      if (v === null || typeof v !== 'object') return v;
      if (Array.isArray(v)) return v.map(sort);
      const o = v as Record<string, unknown>;
      const keys = Object.keys(o).sort();
      const out: Record<string, unknown> = {};
      for (const k of keys) out[k] = sort(o[k]);
      return out;
    };
    return JSON.stringify(sort(obj));
  }

  private hashTaxInputFingerprint(obj: Record<string, unknown>): string {
    return createHash('sha256')
      .update(this.stableJsonStringify(obj))
      .digest('hex');
  }

  /**
   * Alinea contexto regulatorio, persiste auditoría append-only y opcionalmente loguea.
   * `TAX_AUDIT_PERSIST=0` desactiva escritura en BD (p. ej. tests).
   * `TAX_AUDIT_LOG=1` añade línea estructurada en logs.
   */
  private async finalizeTaxRegulatoryContext(
    explanation: FinancialExplanation,
    opts: {
      taxYear: number;
      jurisdiction?: string;
      userId: string;
      profileId: string;
      kind: TaxCalculationAuditKind;
      inputFingerprint: Record<string, unknown>;
    },
  ): Promise<FinancialExplanation> {
    if (!explanation.regulatoryContext) return explanation;
    const next: FinancialExplanation = {
      ...explanation,
      regulatoryContext: {
        ...explanation.regulatoryContext,
        taxYear: opts.taxYear,
        jurisdiction:
          opts.jurisdiction ?? explanation.regulatoryContext.jurisdiction,
        computedAt: new Date().toISOString(),
      },
    };
    const payload = buildTaxCalculationAuditPayload(next, {
      taxYear: opts.taxYear,
    });
    const inputHash = this.hashTaxInputFingerprint(opts.inputFingerprint);

    if (process.env.TAX_AUDIT_LOG === '1') {
      this.logger.log(
        `tax.calculation.audit ${JSON.stringify({ ...payload, inputHash })}`,
      );
    }

    if (process.env.TAX_AUDIT_PERSIST !== '0') {
      try {
        const auditJson = JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
        await this.prisma.taxCalculationAudit.create({
          data: {
            userId: opts.userId,
            profileId: opts.profileId,
            kind: opts.kind,
            taxYear: opts.taxYear,
            jurisdiction: next.regulatoryContext!.jurisdiction,
            lawPackageId: payload.lawPackageId,
            engineVersion: payload.engineVersion,
            domain: payload.domain,
            appliedRuleRefs: payload.appliedRuleRefsInOrder,
            auditPayload: auditJson,
            inputHash,
          },
        });
      } catch (err) {
        this.logger.warn(
          `TaxCalculationAudit persist failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return next;
  }

  /**
   * Agrega gastos (cashflow), deudas e inversiones activas al paquete que consume el motor CO-AG2026.
   */
  private async loadNormalizedTaxFinancials(
    userId: string,
  ): Promise<NormalizedTaxFinancials> {
    const [expenseStreams, debts, positions] = await Promise.all([
      this.prisma.cashflowStream.findMany({
        where: { userId, flowType: 'EXPENSE', isActive: true },
        include: { category: true },
      }),
      this.prisma.debt.findMany({ where: { userId } }),
      this.prisma.investmentPosition.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { type: true },
      }),
    ]);

    return normalizeFinancialDataForTax({
      expenseStreams: expenseStreams.map((s) => ({
        id: s.id,
        name: s.name,
        expectedAmount: Number(s.expectedAmount),
        frequency: s.frequency,
        customFrequencyMonths: s.customFrequencyMonths,
        categoryName: s.category.name,
        currency: s.currency,
        fiscalExpenseHint: s.category.fiscalExpenseHint,
      })),
      debts: debts.map((d) => ({
        id: d.id,
        name: d.name,
        debtKind: d.debtKind,
        remainingAmount: Number(d.remainingAmount),
        interestRate:
          d.interestRate != null ? Number(d.interestRate) : null,
        monthlyPayment:
          d.monthlyPayment != null ? Number(d.monthlyPayment) : null,
        currency: d.currency,
      })),
      investments: positions.map((p) => ({
        positionId: p.id,
        name: p.name,
        typeId: p.typeId,
        typeName: p.type.name,
        fiscalAssetTreatment: p.type.fiscalAssetTreatment,
      })),
    });
  }

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

    const normalized = await this.loadNormalizedTaxFinancials(userId);

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
      normalized,
    );

    const plan = await this.prisma.taxPlan.create({
      data: {
        profileId: profile.id,
        normalizedSnapshot: JSON.parse(
          JSON.stringify(normalized),
        ) as Prisma.InputJsonValue,
      },
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
      UVT_2026,
      normalized,
    );
    let explanation = augmentTaxExplanation(coreExpl, {
      incomeStreamCount: incomeStreams.length,
      engineVersion: this.engine.version,
      missingConditions: [
        ...new Set(classifications.flatMap((c) => c.missingConditions)),
      ],
      extraAssumptions: [
        'Escenarios “conservador” y “optimizado” se generan con el mismo ingreso clasificado.',
        'Gastos activos, deudas e inversiones (cashflow/deudas/módulo inversiones) alimentan deducciones e intereses hipotecarios cuando el modelo puede inferirlos.',
        ...normalized.warnings,
      ],
    });
    explanation = await this.finalizeTaxRegulatoryContext(explanation, {
      taxYear: profile.taxYear,
      jurisdiction: profile.jurisdiction ?? 'CO',
      userId,
      profileId: profile.id,
      kind: 'PLAN_RECALC',
      inputFingerprint: {
        incomeStreamCount: incomeStreams.length,
        classificationRefs: classifications.map((c) => c.referenceId).sort(),
        normalizedDeductionLines: normalized.deductions.length,
        normalizedLiabilities: normalized.liabilities.length,
        normalizedInvestments: normalized.investments.length,
        warningsCount: normalized.warnings.length,
        benefitFlags: {
          hasDependents: profile.hasDependents,
          hasVoluntaryPension: profile.hasVoluntaryPension,
          hasAFC: profile.hasAFC,
          hasPrepaidMedicine: profile.hasPrepaidMedicine,
          hasHousingInterest: profile.hasHousingInterest,
        },
      },
    });

    const confidence = await this.confidenceService.evaluateTax(userId);

    return {
      profile,
      classifications,
      scenarios,
      explanation,
      confidence,
      normalizedForTax: normalized,
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
      id: latestPlan.id,
      profileId: latestPlan.profileId,
      generatedAt: latestPlan.generatedAt,
      scenarios: latestPlan.scenarios,
      normalizedForTax: latestPlan.normalizedSnapshot,
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

    const normalized = await this.loadNormalizedTaxFinancials(userId);

    const totalAnnual = incomeStreams.reduce((a, s) => a + s.amount, 0);
    let leverComparison = this.engine.compareLeverScenarios(
      profileInput,
      classifications,
      normalized,
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
      UVT_2026,
      normalized,
    );
    let explanation = augmentTaxExplanation(coreDeclExpl, {
      incomeStreamCount: streams.length,
      engineVersion: this.engine.version,
      missingConditions: [
        ...new Set(classifications.flatMap((c) => c.missingConditions)),
      ],
      extraAssumptions: [
        'Comparación por palanca: cada fila recalcula el motor con un subconjunto de beneficios.',
        `Umbral ingreso “establecido”: stream con antigüedad > 365 días.`,
        `Umbral filing orientativo: ingreso ≥ ${approxFilingThresholdUvt} UVT × ${UVT_2026} COP/UVT.`,
        ...normalized.warnings,
      ],
    });
    explanation = await this.finalizeTaxRegulatoryContext(explanation, {
      taxYear: profile.taxYear,
      jurisdiction: profile.jurisdiction ?? 'CO',
      userId,
      profileId: profile.id,
      kind: 'DECLARATION_INSIGHTS',
      inputFingerprint: {
        incomeStreamCount: streams.length,
        classificationRefs: classifications.map((c) => c.referenceId).sort(),
        leverRowIds: leverComparison.map((r) => r.id).sort(),
        normalizedDeductionLines: normalized.deductions.length,
        normalizedLiabilities: normalized.liabilities.length,
        normalizedInvestments: normalized.investments.length,
        warningsCount: normalized.warnings.length,
      },
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
    const normalized = await this.loadNormalizedTaxFinancials(userId);
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
        UVT_2026,
        normalized,
      );
    const conservativeTax = calculateColombiaIncomeTaxUVT2026(totalAnnual);

    let explanation = mergeFinancialExplanations(corePreviewExpl, {
      assumptions: [
        `Palancas simuladas (combinación): ${unique.join(', ')}.`,
        'Resto de beneficios en cero salvo datos de residencia del perfil (applyTaxLeverSelection).',
        ...normalized.warnings,
      ],
    });
    explanation = await this.finalizeTaxRegulatoryContext(explanation, {
      taxYear: profile.taxYear,
      jurisdiction: profile.jurisdiction ?? 'CO',
      userId,
      profileId: profile.id,
      kind: 'LEVER_PREVIEW',
      inputFingerprint: {
        leverIds: [...unique].sort(),
        incomeStreamCount: streams.length,
        classificationRefs: classifications.map((c) => c.referenceId).sort(),
        normalizedDeductionLines: normalized.deductions.length,
        normalizedLiabilities: normalized.liabilities.length,
        normalizedInvestments: normalized.investments.length,
      },
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
