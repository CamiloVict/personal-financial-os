import { Injectable } from '@nestjs/common';
import { FeasibilityLevel, ScenarioType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllGoals(userId?: string) {
    return this.prisma.savingGoal.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  createGoal(payload: Record<string, unknown>) {
    return this.prisma.savingGoal.create({
      data: {
        ...payload,
        targetDate: payload.targetDate
          ? new Date(payload.targetDate as string)
          : null,
      } as any,
    });
  }

  async getGoalRecommendations(goalId: string) {
    const rec = await this.prisma.goalRecommendation.findFirst({
      where: { goalId },
      orderBy: { generatedAt: 'desc' },
      include: { scenarios: true },
    });
    if (!rec) return null;
    return { ...rec, scenarios: rec.scenarios };
  }

  async recalculateRecommendations(goalId: string) {
    const goal = await this.prisma.savingGoal.findUnique({
      where: { id: goalId },
    });
    if (!goal) throw new Error('Goal not found');

    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId: goal.userId },
    });
    const incomeStreams = streams.filter((s) => s.flowType === 'INCOME');
    const expenseStreams = streams.filter((s) => s.flowType === 'EXPENSE');

    const totalIncome = incomeStreams.reduce(
      (acc, s) => acc + Number(s.expectedAmount),
      0,
    );
    const totalExpense = expenseStreams.reduce(
      (acc, s) => acc + Number(s.expectedAmount),
      0,
    );
    const currentMonthlySavings = totalIncome - totalExpense;

    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount || 0);
    const shortfall = targetAmount - currentAmount;

    const targetDate = goal.targetDate ? new Date(goal.targetDate) : new Date();
    const now = new Date();
    const monthsRemaining = Math.max(
      1,
      Math.ceil(
        (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30),
      ),
    );

    const monthlyAmountNeeded = Math.round(shortfall / monthsRemaining);
    const monthlyShortfall = Math.round(monthlyAmountNeeded - currentMonthlySavings);

    let currentProjectedMonths: number | null = null;
    if (currentMonthlySavings > 0) {
      currentProjectedMonths = Math.ceil(shortfall / currentMonthlySavings);
    }

    let feasibilityLevel: FeasibilityLevel = FeasibilityLevel.REASONABLE;
    if (monthlyShortfall > currentMonthlySavings * 2)
      feasibilityLevel = FeasibilityLevel.UNREALISTIC;
    else if (monthlyShortfall > currentMonthlySavings)
      feasibilityLevel = FeasibilityLevel.AGGRESSIVE;
    else if (monthlyShortfall <= 0)
      feasibilityLevel = FeasibilityLevel.CONSERVATIVE;

    const recommendation = await this.prisma.goalRecommendation.create({
      data: {
        goalId,
        currentMonthlySavings,
        targetAmount,
        currentAmount,
        monthsRemaining,
        monthlyAmountNeeded,
        monthlyShortfall,
        currentProjectedMonths,
        feasibilityLevel,
      },
    });

    await this.generateScenarios(
      recommendation.id,
      monthlyShortfall,
      totalIncome,
      totalExpense,
      currentMonthlySavings,
      shortfall,
      monthsRemaining,
    );

    return this.getGoalRecommendations(goalId);
  }

  private async generateScenarios(
    recommendationId: string,
    monthlyShortfall: number,
    income: number,
    expense: number,
    currentMonthlySavings: number,
    totalShortfall: number,
    originalMonthsRemaining: number,
  ) {
    if (monthlyShortfall <= 0) {
      const projectedMonths =
        currentMonthlySavings > 0
          ? Math.ceil(totalShortfall / currentMonthlySavings)
          : originalMonthsRemaining;
      const monthsSaved = Math.max(0, originalMonthsRemaining - projectedMonths);

      await this.prisma.recommendationScenario.create({
        data: {
          recommendationId,
          type: ScenarioType.COMBINED_STRATEGY,
          explanation: `A tu ritmo actual de ahorro ($${Math.round(currentMonthlySavings).toLocaleString()}/mes), alcanzarás la meta en ${projectedMonths} meses, lo cual es antes del tiempo estimado. ¡Sigue así!`,
          feasibilityLevel: FeasibilityLevel.CONSERVATIVE,
          newProjectedMonths: projectedMonths,
          monthsSaved,
        },
      });
      return;
    }

    const incomeIncreasePercent = income > 0 ? (monthlyShortfall / income) * 100 : 100;
    const incomeFeasibility =
      incomeIncreasePercent > 50
        ? FeasibilityLevel.UNREALISTIC
        : incomeIncreasePercent > 30
          ? FeasibilityLevel.AGGRESSIVE
          : incomeIncreasePercent > 10
            ? FeasibilityLevel.REASONABLE
            : FeasibilityLevel.CONSERVATIVE;

    await this.prisma.recommendationScenario.create({
      data: {
        recommendationId,
        type: ScenarioType.INCREASE_INCOME,
        incomeIncreaseAmount: Math.round(monthlyShortfall),
        explanation: `Necesitas aumentar tus ingresos mensuales libres en $${Math.round(monthlyShortfall).toLocaleString()} (aprox. ${incomeIncreasePercent.toFixed(1)}%). Puedes lograrlo consiguiendo un trabajo paralelo, trabajos freelance, o negociando un aumento salarial. Al hacerlo, lograrás tu meta exactamente a tiempo.`,
        feasibilityLevel: incomeFeasibility,
        newProjectedMonths: originalMonthsRemaining,
        monthsSaved: 0,
      },
    });

    const expenseReductionPercent =
      expense > 0 ? (monthlyShortfall / expense) * 100 : Infinity;
    const expenseFeasibility =
      expenseReductionPercent >= 100
        ? FeasibilityLevel.UNREALISTIC
        : expenseReductionPercent > 20
          ? FeasibilityLevel.AGGRESSIVE
          : expenseReductionPercent > 10
            ? FeasibilityLevel.REASONABLE
            : FeasibilityLevel.CONSERVATIVE;

    let expExplanation = '';
    if (expenseReductionPercent >= 100) {
      expExplanation = `Reducir tus gastos en $${Math.round(monthlyShortfall).toLocaleString()} no es realista, ya que supera o iguala tus gastos totales actuales ($${Math.round(expense).toLocaleString()}).`;
    } else {
      expExplanation = `Podrías lograr tu meta a tiempo si reduces tus gastos mensuales en $${Math.round(monthlyShortfall).toLocaleString()} (aprox. ${expenseReductionPercent.toFixed(1)}%). Revisa tus suscripciones, salidas a restaurantes o gastos discrecionales que puedan ser recortados temporalmente.`;
    }

    await this.prisma.recommendationScenario.create({
      data: {
        recommendationId,
        type: ScenarioType.REDUCE_EXPENSES,
        expenseReductionAmount: Math.round(monthlyShortfall),
        explanation: expExplanation,
        feasibilityLevel: expenseFeasibility,
        newProjectedMonths: originalMonthsRemaining,
        monthsSaved: 0,
      },
    });

    const maxRealisticExpenseReduction = expense * 0.15;
    let combExpenseAmount = monthlyShortfall / 2;
    let combIncomeAmount = monthlyShortfall / 2;

    if (combExpenseAmount > maxRealisticExpenseReduction) {
      combExpenseAmount = maxRealisticExpenseReduction;
      combIncomeAmount = monthlyShortfall - combExpenseAmount;
    }

    const combIncomePercent =
      income > 0 ? (combIncomeAmount / income) * 100 : 100;
    const combExpensePercent =
      expense > 0 ? (combExpenseAmount / expense) * 100 : Infinity;

    let combFeasibility: FeasibilityLevel = FeasibilityLevel.REASONABLE;
    if (combIncomePercent > 30 || combExpensePercent > 30)
      combFeasibility = FeasibilityLevel.AGGRESSIVE;
    if (combIncomePercent > 50 || combExpensePercent >= 100)
      combFeasibility = FeasibilityLevel.UNREALISTIC;

    await this.prisma.recommendationScenario.create({
      data: {
        recommendationId,
        type: ScenarioType.COMBINED_STRATEGY,
        incomeIncreaseAmount: Math.round(combIncomeAmount),
        expenseReductionAmount: Math.round(combExpenseAmount),
        explanation: `Estrategia balanceada (Recomendada): Aumenta tus ingresos en $${Math.round(combIncomeAmount).toLocaleString()} (${combIncomePercent.toFixed(1)}%) y a la vez recorta tus gastos en $${Math.round(combExpenseAmount).toLocaleString()} (${combExpensePercent.toFixed(1)}%). Esta estrategia dual divide el esfuerzo y es estadísticamente más sostenible a largo plazo para llegar a tu objetivo en ${originalMonthsRemaining} meses.`,
        feasibilityLevel: combFeasibility,
        newProjectedMonths: originalMonthsRemaining,
        monthsSaved: 0,
      },
    });
  }
}
