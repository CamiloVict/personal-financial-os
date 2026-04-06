import { Injectable } from '@nestjs/common';
import { createNode, emptyFinancialExplanation } from '@personal-finance-os/explanation';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ConfidenceService } from '../confidence/confidence.service';

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

  /**
   * Serie mensual (últimos 12 meses UTC) desde eventos de cashflow registrados.
   * Sin eventos, la serie existe con ceros para mantener el eje temporal estable.
   */
  async getCashflowMonthlyTrend(userId: string) {
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

    const explanation = {
      ...emptyFinancialExplanation(
        'analytics.cashflow_monthly_trend',
        'Tendencia mensual desde eventos de flujo',
      ),
      inputs: [
        createNode({
          kind: 'input',
          label: 'Eventos en ventana',
          value: events.length,
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
      eventCount: events.length,
      explanation,
      confidence,
    };
  }
}
