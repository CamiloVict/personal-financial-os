import { Injectable } from '@nestjs/common';
import { createNode, emptyFinancialExplanation } from '@personal-finance-os/explanation';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ConfidenceService } from '../confidence/confidence.service';
import {
  buildInsightsFromSnapshot,
  prioritizeInsights,
  type InsightSnapshot,
  type ProductInsight,
} from './insights.engine';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly confidenceService: ConfidenceService,
  ) {}

  async getCashflowDistribution(userId: string) {
    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId },
    });
    const categories = await this.prisma.category.findMany({
      where: { userId },
    });

    const expenses = streams.filter((s) => s.flowType === 'EXPENSE');
    const income = streams.filter((s) => s.flowType === 'INCOME');

    const expenseByCategory = expenses.reduce(
      (acc: Record<string, number>, curr) => {
        const cat =
          categories.find((c) => c.id === curr.categoryId)?.name || 'Otros';
        acc[cat] = (acc[cat] || 0) + Number(curr.expectedAmount);
        return acc;
      },
      {},
    );

    const incomeByType = income.reduce(
      (acc: Record<string, number>, curr) => {
        const type = curr.streamType;
        acc[type] = (acc[type] || 0) + Number(curr.expectedAmount);
        return acc;
      },
      {},
    );

    const explanation = {
      ...emptyFinancialExplanation(
        'analytics.cashflow_distribution',
        'Distribución de flujos por categoría / tipo',
      ),
      inputs: [
        createNode({
          kind: 'input',
          label: 'Streams considerados',
          value: streams.length,
        }),
      ],
      steps: [
        createNode({
          kind: 'aggregation',
          label: 'Agregación mensual',
          description:
            'Gastos agrupados por categoría; ingresos por streamType (FIXED/VARIABLE).',
        }),
      ],
      assumptions: [
        'Montos expectedAmount por periodo del stream sin anualizar en este gráfico.',
      ],
      missingData: [],
      normativeRefs: [],
    };

    const confidence =
      await this.confidenceService.evaluateCashflow(userId);

    return {
      expenses: Object.entries(expenseByCategory).map(([name, value]) => ({
        name,
        value,
      })),
      income: Object.entries(incomeByType).map(([name, value]) => ({
        name,
        value,
      })),
      explanation,
      confidence,
    };
  }

  async getNetWorthAnalytics(userId: string) {
    const investments = await this.prisma.investmentPosition.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const totalInvestments = investments.reduce(
      (acc, p) => acc + Number(p.currentEstimatedValue),
      0,
    );
    const initialCapital = investments.reduce(
      (acc, p) => acc + Number(p.initialCapital),
      0,
    );
    const totalReturn = totalInvestments - initialCapital;

    const types = await this.prisma.investmentTypeDefinition.findMany();
    const composition = investments.reduce(
      (acc: Record<string, number>, curr) => {
        const t =
          types.find((ty) => ty.id === curr.typeId)?.name || 'Other';
        acc[t] = (acc[t] || 0) + Number(curr.currentEstimatedValue);
        return acc;
      },
      {},
    );

    const explanation = {
      ...emptyFinancialExplanation(
        'analytics.net_worth',
        'Patrimonio desde posiciones de inversión activas',
      ),
      inputs: [
        createNode({
          kind: 'input',
          label: 'Posiciones ACTIVE',
          value: investments.length,
        }),
      ],
      steps: [
        createNode({
          kind: 'aggregation',
          label: 'Suma currentEstimatedValue',
          description: 'No incluye efectivo, bienes fuera del módulo de inversiones ni deudas netas.',
        }),
      ],
      assumptions: [
        'Valoraciones manuales o último evento según datos en cada posición.',
      ],
      missingData: ['Otros activos/pasivos no modelados en InvestmentPosition.'],
      normativeRefs: [],
    };

    const confidence =
      await this.confidenceService.evaluateInvestments(userId);

    return {
      netWorth: totalInvestments,
      totalReturn,
      composition: Object.entries(composition).map(([name, value]) => ({
        name,
        value,
      })),
      explanation,
      confidence,
    };
  }

  async getTaxAnalytics(userId: string) {
    const confidence = await this.confidenceService.evaluateTax(userId);

    const profile = await this.prisma.taxProfile.findFirst({
      where: { userId },
      orderBy: [{ taxYear: 'desc' }, { updatedAt: 'desc' }],
    });
    if (!profile) {
      const explanation = {
        ...emptyFinancialExplanation(
          'analytics.tax_dashboard',
          'Sin perfil fiscal: no hay escenarios guardados',
        ),
        assumptions: ['Completa tu perfil y genera un plan en Fiscal.'],
        missingData: ['TaxProfile y TaxPlan'],
        normativeRefs: [],
      };
      return {
        scenariosComparison: null,
        explanation,
        confidence,
      };
    }

    const plan = await this.prisma.taxPlan.findFirst({
      where: { profileId: profile.id },
      orderBy: { generatedAt: 'desc' },
      include: { scenarios: true },
    });
    if (!plan) {
      const explanation = {
        ...emptyFinancialExplanation(
          'analytics.tax_dashboard',
          'Perfil sin plan fiscal persistido',
        ),
        assumptions: ['Genera un plan en Fiscal para ver comparativa aquí.'],
        missingData: ['TaxPlan'],
        normativeRefs: [],
      };
      return {
        scenariosComparison: null,
        explanation,
        confidence,
      };
    }

    const explanation = {
      ...emptyFinancialExplanation(
        'analytics.tax_dashboard',
        'Comparación rápida de escenarios del último plan',
      ),
      steps: plan.scenarios.map((s) =>
        createNode({
          kind: 'result',
          label: s.name,
          value: Number(s.estimatedNetTaxPayable),
          description: s.explanation ?? undefined,
        }),
      ),
      assumptions: [
        'Datos del último TaxPlan persistido; no recalcula motor en tiempo real.',
      ],
      missingData: [],
      normativeRefs: [],
    };

    return {
      scenariosComparison: plan.scenarios.map((s) => ({
        name: s.name,
        taxableBase: Number(s.estimatedTaxableBase),
        taxLiability: Number(s.estimatedTaxLiability),
        netTaxPayable: Number(s.estimatedNetTaxPayable),
        deductionsAndExemptions:
          Number(s.estimatedDeductions) + Number(s.estimatedExemptions),
      })),
      explanation,
      confidence,
    };
  }

  private async buildCashflowMonthlySeries(userId: string): Promise<{
    series: {
      month: string;
      income: number;
      expense: number;
      net: number;
    }[];
    eventCount: number;
  }> {
    const since = new Date();
    since.setUTCFullYear(since.getUTCFullYear(), since.getUTCMonth() - 11, 1);
    since.setUTCHours(0, 0, 0, 0);

    const events = await this.prisma.cashflowEvent.findMany({
      where: {
        date: { gte: since },
        stream: { userId },
      },
      include: {
        stream: { select: { flowType: true } },
      },
    });

    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const e of events) {
      const key = e.date.toISOString().slice(0, 7);
      const prev = byMonth.get(key) ?? { income: 0, expense: 0 };
      const amt = Number(e.amount);
      if (e.stream.flowType === 'INCOME') prev.income += amt;
      else prev.expense += amt;
      byMonth.set(key, prev);
    }

    const series: {
      month: string;
      income: number;
      expense: number;
      net: number;
    }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
      );
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const p = byMonth.get(key) ?? { income: 0, expense: 0 };
      series.push({
        month: key,
        income: p.income,
        expense: p.expense,
        net: p.income - p.expense,
      });
    }

    return { series, eventCount: events.length };
  }

  /**
   * Serie mensual (últimos 12 meses UTC) desde eventos de cashflow registrados.
   * Sin eventos, la serie existe con ceros para mantener el eje temporal estable.
   */
  async getCashflowMonthlyTrend(userId: string) {
    const { series, eventCount } = await this.buildCashflowMonthlySeries(userId);

    const explanation = {
      ...emptyFinancialExplanation(
        'analytics.cashflow_monthly_trend',
        'Tendencia mensual desde eventos de flujo',
      ),
      inputs: [
        createNode({
          kind: 'input',
          label: 'Eventos en ventana',
          value: eventCount,
        }),
      ],
      steps: [
        createNode({
          kind: 'aggregation',
          label: 'Suma por mes UTC',
          description:
            'Ingresos y gastos según flowType del stream; neto = ingresos − gastos del mes.',
        }),
      ],
      assumptions: [
        'Solo incluye meses con eventos registrados en streams; meses sin actividad muestran cero.',
      ],
      missingData: [],
      normativeRefs: [],
    };

    const confidence =
      await this.confidenceService.evaluateCashflow(userId);

    return {
      series,
      eventCount,
      explanation,
      confidence,
    };
  }

  /**
   * Patrones y agregaciones para la vista “cashflow inteligente”: fijo vs variable,
   * categorías pesadas, medias móviles de flujo neto y texto explicativo.
   */
  async getCashflowIntelligence(userId: string) {
    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId },
    });
    const categories = await this.prisma.category.findMany({
      where: { userId },
    });

    let incomeFixed = 0;
    let incomeVariable = 0;
    let expenseFixed = 0;
    let expenseVariable = 0;
    let mainIncome: { name: string; amount: number } | null = null;

    for (const s of streams) {
      const amt = Number(s.expectedAmount);
      if (s.flowType === 'INCOME') {
        if (s.streamType === 'FIXED') incomeFixed += amt;
        else incomeVariable += amt;
        if (!mainIncome || amt > mainIncome.amount) {
          mainIncome = { name: s.name, amount: amt };
        }
      } else {
        if (s.streamType === 'FIXED') expenseFixed += amt;
        else expenseVariable += amt;
      }
    }

    const incomeTotal = incomeFixed + incomeVariable;
    const expenseTotal = expenseFixed + expenseVariable;
    const savingsRate =
      incomeTotal > 0 ? (incomeTotal - expenseTotal) / incomeTotal : null;
    const fixedExpenseShareOfIncome =
      incomeTotal > 0 ? expenseFixed / incomeTotal : null;
    const freeCashAfterFixedExpenses = incomeTotal - expenseFixed;
    const mainIncomeShare =
      incomeTotal > 0 && mainIncome
        ? mainIncome.amount / incomeTotal
        : null;

    const expenseByCategory: Record<string, number> = {};
    for (const s of streams) {
      if (s.flowType !== 'EXPENSE') continue;
      const cat =
        categories.find((c) => c.id === s.categoryId)?.name || 'Otros';
      expenseByCategory[cat] =
        (expenseByCategory[cat] || 0) + Number(s.expectedAmount);
    }

    const expenseRows = Object.entries(expenseByCategory)
      .map(([name, value]) => ({
        name,
        value,
        shareOfExpense: expenseTotal > 0 ? value / expenseTotal : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const { series, eventCount } = await this.buildCashflowMonthlySeries(userId);
    const nets = series.map((x) => x.net);
    const mean = (arr: number[]) =>
      arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

    const avgNet3 = mean(nets.slice(-3));
    const avgNet6 = mean(nets.slice(-6));
    const avgNet12 = mean(nets.slice(-12));
    const last = series[series.length - 1];
    const lastMonthNet = last?.net ?? 0;
    const lastMonthLabel = last?.month ?? '';

    let vsRolling3Pct: number | null = null;
    if (nets.length >= 3 && avgNet3 !== 0) {
      vsRolling3Pct = (lastMonthNet - avgNet3) / Math.abs(avgNet3);
    } else if (nets.length >= 3 && avgNet3 === 0 && lastMonthNet !== 0) {
      vsRolling3Pct = lastMonthNet > 0 ? 1 : -1;
    }

    const insights: string[] = [];

    if (streams.length === 0) {
      insights.push(
        'Aún no hay streams de cashflow: creá ingresos y gastos esperados para ver el modelo fijo/variable.',
      );
    } else {
      if (fixedExpenseShareOfIncome !== null && fixedExpenseShareOfIncome >= 0.5) {
        insights.push(
          `Tus gastos fijos modelados absorben alrededor del ${(fixedExpenseShareOfIncome * 100).toFixed(0)}% de tus ingresos: poco margen ante imprevistos.`,
        );
      }
      if (savingsRate !== null && savingsRate < 0) {
        insights.push(
          'Con los montos esperados actuales, el modelo muestra gastos por encima de ingresos.',
        );
      }
      for (const row of expenseRows) {
        if (row.shareOfExpense >= 0.22 && row.value > 0) {
          insights.push(
            `La categoría «${row.name}» concentra ~${(row.shareOfExpense * 100).toFixed(0)}% de tus gastos modelados.`,
          );
          break;
        }
      }
      if (mainIncome && mainIncomeShare !== null && mainIncomeShare >= 0.4) {
        insights.push(
          `El ingreso «${mainIncome.name}» representa ~${(mainIncomeShare * 100).toFixed(0)}% de tus ingresos modelados (ingreso principal).`,
        );
      }
    }

    if (eventCount > 0) {
      insights.push(
        `Promedio de flujo neto mensual (eventos, últimos 3 meses): ${avgNet3.toLocaleString('es-CO', { maximumFractionDigits: 0 })}.`,
      );
      insights.push(
        `Medias móviles de flujo neto: 3m ${avgNet3.toLocaleString('es-CO', { maximumFractionDigits: 0 })} · 6m ${avgNet6.toLocaleString('es-CO', { maximumFractionDigits: 0 })} · 12m ${avgNet12.toLocaleString('es-CO', { maximumFractionDigits: 0 })}.`,
      );
      if (vsRolling3Pct !== null && Math.abs(vsRolling3Pct) > 0.08) {
        const dir = vsRolling3Pct > 0 ? 'por encima' : 'por debajo';
        insights.push(
          `El último mes (${lastMonthLabel}) el neto quedó ${dir} del promedio de los últimos 3 meses.`,
        );
      }
    } else {
      insights.push(
        'Registrá eventos reales en tus streams para activar tendencias y comparaciones con medias móviles.',
      );
    }

    const explanation = {
      ...emptyFinancialExplanation(
        'analytics.cashflow_intelligence',
        'Patrones de cashflow (modelo + eventos)',
      ),
      inputs: [
        createNode({
          kind: 'input',
          label: 'Streams',
          value: streams.length,
        }),
        createNode({
          kind: 'input',
          label: 'Eventos (12m)',
          value: eventCount,
        }),
      ],
      steps: [
        createNode({
          kind: 'aggregation',
          label: 'Fijo vs variable',
          description: 'Suma de expectedAmount por streamType y flowType.',
        }),
      ],
      assumptions: [
        'Montos esperados del stream según su periodicidad declarada (sin anualización automática).',
        'Gastos fijos tratados como “compromisos” para el flujo libre post-fijos.',
      ],
      missingData: [],
      normativeRefs: [],
    };

    const confidence =
      await this.confidenceService.evaluateCashflow(userId);

    return {
      model: {
        incomeFixed,
        incomeVariable,
        expenseFixed,
        expenseVariable,
        incomeTotal,
        expenseTotal,
        savingsRate,
        fixedExpenseShareOfIncome,
        freeCashAfterFixedExpenses,
        mainIncomeStream:
          mainIncome && mainIncomeShare !== null
            ? {
                name: mainIncome.name,
                amount: mainIncome.amount,
                shareOfIncome: mainIncomeShare,
              }
            : null,
      },
      expenseByCategory: expenseRows,
      monthly: { series, eventCount },
      rolling: {
        avgNet3,
        avgNet6,
        avgNet12,
        lastMonthNet,
        lastMonthLabel,
        vsRolling3Pct,
      },
      insights,
      explanation,
      confidence,
    };
  }

  private async buildInsightSnapshot(userId: string): Promise<InsightSnapshot> {
    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId },
    });
    const categories = await this.prisma.category.findMany({
      where: { userId },
    });

    let incomeFixed = 0;
    let incomeVariable = 0;
    let expenseFixed = 0;
    let expenseVariable = 0;
    for (const s of streams) {
      const amt = Number(s.expectedAmount);
      if (s.flowType === 'INCOME') {
        if (s.streamType === 'FIXED') incomeFixed += amt;
        else incomeVariable += amt;
      } else {
        if (s.streamType === 'FIXED') expenseFixed += amt;
        else expenseVariable += amt;
      }
    }

    const incomeTotal = incomeFixed + incomeVariable;
    const expenseTotal = expenseFixed + expenseVariable;
    const savingsRate =
      incomeTotal > 0 ? (incomeTotal - expenseTotal) / incomeTotal : null;
    const fixedExpenseShareOfIncome =
      incomeTotal > 0 ? expenseFixed / incomeTotal : null;

    const expenseByCategory: Record<string, number> = {};
    for (const s of streams) {
      if (s.flowType !== 'EXPENSE') continue;
      const cat =
        categories.find((c) => c.id === s.categoryId)?.name || 'Otros';
      expenseByCategory[cat] =
        (expenseByCategory[cat] || 0) + Number(s.expectedAmount);
    }
    let topExpenseCategory: { name: string; share: number } | null = null;
    if (expenseTotal > 0) {
      for (const [name, value] of Object.entries(expenseByCategory)) {
        const share = value / expenseTotal;
        if (!topExpenseCategory || share > topExpenseCategory.share) {
          topExpenseCategory = { name, share };
        }
      }
    }

    const { series } = await this.buildCashflowMonthlySeries(userId);
    const nets = series.map((x) => x.net);
    const mean = (arr: number[]) =>
      arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
    const avgNet3 = mean(nets.slice(-3));
    const last = series[series.length - 1];
    const lastMonthNet = last?.net ?? 0;
    let vsRolling3Pct: number | null = null;
    if (nets.length >= 3 && avgNet3 !== 0) {
      vsRolling3Pct = (lastMonthNet - avgNet3) / Math.abs(avgNet3);
    } else if (nets.length >= 3 && avgNet3 === 0 && lastMonthNet !== 0) {
      vsRolling3Pct = lastMonthNet > 0 ? 1 : -1;
    }

    const goalsDb = await this.prisma.savingGoal.findMany({
      where: { userId },
    });
    const goals = goalsDb.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount ?? 0);
      const progress = target > 0 ? current / target : 0;
      let expectedProgress: number | null = null;
      if (g.targetDate && g.createdAt) {
        const start = g.createdAt.getTime();
        const end = g.targetDate.getTime();
        const now = Date.now();
        if (end > start && now >= start) {
          expectedProgress = Math.min(1, Math.max(0, (now - start) / (end - start)));
        }
      }
      return {
        id: g.id,
        name: g.name,
        progress,
        expectedProgress,
      };
    });

    const positions = await this.prisma.investmentPosition.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { type: true },
    });
    const totalValue = positions.reduce(
      (a, p) => a + Number(p.currentEstimatedValue),
      0,
    );
    const byType: Record<string, number> = {};
    for (const p of positions) {
      const n = p.type?.name || 'Otro';
      byType[n] = (byType[n] || 0) + Number(p.currentEstimatedValue);
    }
    let topTypeName: string | null = null;
    let topTypeShare: number | null = null;
    if (totalValue > 0) {
      for (const [name, v] of Object.entries(byType)) {
        const sh = v / totalValue;
        if (topTypeShare === null || sh > topTypeShare) {
          topTypeShare = sh;
          topTypeName = name;
        }
      }
    }

    const invEvents = await this.prisma.investmentEvent.findMany({
      where: { investment: { userId } },
      select: { type: true, amount: true },
    });
    let dist = 0;
    let rein = 0;
    for (const e of invEvents) {
      if (e.type === 'PROFIT_DISTRIBUTION') dist += Number(e.amount);
      if (e.type === 'PROFIT_REINVESTMENT') rein += Number(e.amount);
    }
    const profitDistributedExceedsReinvest =
      dist > rein * 1.25 && dist > 0;

    const debts = await this.prisma.debt.findMany({
      where: { userId },
    });
    const totalRemaining = debts.reduce(
      (a, d) => a + Number(d.remainingAmount),
      0,
    );
    const monthlyPaymentTotal = debts.reduce(
      (a, d) => a + Number(d.monthlyPayment ?? 0),
      0,
    );

    const taxProfile = await this.prisma.taxProfile.findFirst({
      where: { userId },
      orderBy: [{ taxYear: 'desc' }, { updatedAt: 'desc' }],
    });
    const taxPlan = taxProfile
      ? await this.prisma.taxPlan.findFirst({
          where: { profileId: taxProfile.id },
          orderBy: { generatedAt: 'desc' },
          include: { scenarios: true },
        })
      : null;

    let taxSavingsPotential: number | null = null;
    if (taxPlan?.scenarios?.length) {
      const cons = taxPlan.scenarios.find((s) => s.type === 'CONSERVATIVE');
      const opt = taxPlan.scenarios.find((s) => s.type === 'OPTIMIZED');
      if (cons && opt) {
        taxSavingsPotential =
          Number(cons.estimatedNetTaxPayable) -
          Number(opt.estimatedNetTaxPayable);
      }
    }

    let unclaimedBenefitHints = 0;
    if (taxProfile) {
      if (!taxProfile.hasDependents) unclaimedBenefitHints++;
      if (!taxProfile.hasVoluntaryPension) unclaimedBenefitHints++;
      if (!taxProfile.hasAFC) unclaimedBenefitHints++;
      if (!taxProfile.hasPrepaidMedicine) unclaimedBenefitHints++;
      if (!taxProfile.hasHousingInterest) unclaimedBenefitHints++;
    }

    const snapshot: InsightSnapshot = {
      cashflow: {
        streamsCount: streams.length,
        incomeTotal,
        expenseTotal,
        expenseFixed,
        savingsRate,
        fixedExpenseShareOfIncome,
        topExpenseCategory,
        lastMonthNet,
        avgNet3,
        vsRolling3Pct,
      },
      goals,
      investments: {
        positionCount: positions.length,
        totalValue,
        topTypeShare,
        topTypeName,
        profitDistributedExceedsReinvest,
      },
      debts: {
        totalRemaining,
        monthlyPaymentTotal,
      },
      tax: {
        hasProfile: !!taxProfile,
        hasPlan: !!taxPlan && (taxPlan.scenarios?.length ?? 0) > 0,
        taxSavingsPotential,
        unclaimedBenefitHints,
      },
    };

    return snapshot;
  }

  /**
   * Insights transversales priorizados (máx. 8) con reglas explicables y bajo ruido.
   */
  async getProductInsights(userId: string): Promise<{
    insights: ProductInsight[];
    snapshot: InsightSnapshot;
    generatedAt: string;
  }> {
    const snapshot = await this.buildInsightSnapshot(userId);
    const raw = buildInsightsFromSnapshot(snapshot);
    const insights = prioritizeInsights(raw, 8);
    return {
      insights,
      snapshot,
      generatedAt: new Date().toISOString(),
    };
  }
}
