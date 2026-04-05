import { Injectable } from '@nestjs/common';
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

    return {
      expenses: Object.entries(expenseByCategory).map(([name, value]) => ({
        name,
        value,
      })),
      income: Object.entries(incomeByType).map(([name, value]) => ({
        name,
        value,
      })),
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

    return {
      netWorth: totalInvestments,
      totalReturn,
      composition: Object.entries(composition).map(([name, value]) => ({
        name,
        value,
      })),
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

    return {
      scenariosComparison: plan.scenarios.map((s) => ({
        name: s.name,
        taxableBase: Number(s.estimatedTaxableBase),
        taxLiability: Number(s.estimatedTaxLiability),
        netTaxPayable: Number(s.estimatedNetTaxPayable),
        deductionsAndExemptions:
          Number(s.estimatedDeductions) + Number(s.estimatedExemptions),
      })),
    };
  }
}
