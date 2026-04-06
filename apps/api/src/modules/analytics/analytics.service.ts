import { Injectable } from '@nestjs/common';
import { createNode, emptyFinancialExplanation } from '@personal-finance-os/explanation';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return {
      netWorth: totalInvestments,
      totalReturn,
      composition: Object.entries(composition).map(([name, value]) => ({
        name,
        value,
      })),
      explanation,
    };
  }

  async getTaxAnalytics(userId: string) {
    const profile = await this.prisma.taxProfile.findFirst({
      where: { userId },
      orderBy: [{ taxYear: 'desc' }, { updatedAt: 'desc' }],
    });
    if (!profile) return null;

    const plan = await this.prisma.taxPlan.findFirst({
      where: { profileId: profile.id },
      orderBy: { generatedAt: 'desc' },
      include: { scenarios: true },
    });
    if (!plan) return null;

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
    };
  }
}
