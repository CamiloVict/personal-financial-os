import { Injectable, NotFoundException } from '@nestjs/common';
import { FeasibilityLevel, ScenarioType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  annualToMonthlyRate,
  DEFAULT_PROJECTION_SCENARIOS,
  monthsToReachTarget,
  splitContributionVsGrowth,
} from './goal-projection.util';

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

  async getLatestScenarioSnapshot(goalId: string) {
    const rec = await this.prisma.goalRecommendation.findFirst({
      where: { goalId },
      orderBy: { generatedAt: 'desc' },
      include: { scenarios: true },
    });
    if (!rec) return null;
    return { ...rec, scenarios: rec.scenarios };
  }

  /**
   * Proyecciones y tiempos a meta bajo varias tasas y aportes (sin persistir).
   * Complementa la simulación de brechas con guidance cuantitativo.
   */
  async getGoalProjection(goalId: string, userId: string) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new NotFoundException('Meta no encontrada');

    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId },
    });
    const ctx = this.computeGoalCashContext(goal, streams);
    const pv = ctx.currentAmount;
    const targetBalance = ctx.targetAmount;

    const scenarios = DEFAULT_PROJECTION_SCENARIOS.map((def) => {
      const monthlyContribution = def.useRequiredMonthly
        ? ctx.monthlyAmountNeeded
        : ctx.currentMonthlySavings;
      const rm = annualToMonthlyRate(def.annualReturnPct);
      const monthsToTarget = monthsToReachTarget(
        pv,
        monthlyContribution,
        rm,
        targetBalance,
      );
      const est = new Date();
      if (monthsToTarget != null) {
        est.setMonth(est.getMonth() + monthsToTarget);
      }
      const h5 = splitContributionVsGrowth(pv, monthlyContribution, rm, 60);
      const h15 = splitContributionVsGrowth(pv, monthlyContribution, rm, 180);

      let feasibilityLevel: FeasibilityLevel = FeasibilityLevel.REASONABLE;
      if (def.key === 'ACTUAL' || def.key === 'CONSERVATIVE') {
        feasibilityLevel = FeasibilityLevel.CONSERVATIVE;
      } else if (def.key === 'OPTIMIZED') {
        feasibilityLevel = FeasibilityLevel.AGGRESSIVE;
      } else if (def.key === 'COMBINED') {
        if (ctx.monthlyShortfall <= 0) {
          feasibilityLevel = FeasibilityLevel.CONSERVATIVE;
        } else if (ctx.monthlyAmountNeeded > ctx.currentMonthlySavings * 2) {
          feasibilityLevel = FeasibilityLevel.UNREALISTIC;
        } else if (ctx.monthlyAmountNeeded > ctx.currentMonthlySavings) {
          feasibilityLevel = FeasibilityLevel.AGGRESSIVE;
        }
      }

      return {
        key: def.key,
        label: def.label,
        annualReturnPct: def.annualReturnPct,
        monthlyContributionModel: monthlyContribution,
        monthsToTarget,
        estimatedReachDate:
          monthsToTarget != null ? est.toISOString().slice(0, 10) : null,
        horizon5y: {
          months: 60,
          futureValue: h5.futureValue,
          contributions: h5.contributions,
          growth: h5.growth,
        },
        horizon15y: {
          months: 180,
          futureValue: h15.futureValue,
          contributions: h15.contributions,
          growth: h15.growth,
        },
        feasibilityLevel,
        narrative: this.projectionNarrative(
          def.key,
          ctx,
          monthsToTarget,
          monthlyContribution,
        ),
      };
    });

    const strategy = this.pickStrategyHint(ctx, scenarios);

    return {
      goalId: goal.id,
      goalName: goal.name,
      cashContext: {
        currentMonthlySavings: ctx.currentMonthlySavings,
        monthlyAmountNeeded: ctx.monthlyAmountNeeded,
        monthlyShortfall: ctx.monthlyShortfall,
        monthsRemainingModel: ctx.monthsRemaining,
        shortfall: ctx.shortfall,
        totalIncome: ctx.totalIncome,
        totalExpense: ctx.totalExpense,
        currentProjectedMonths: ctx.currentProjectedMonths,
        feasibilityLevel: ctx.feasibilityLevel,
      },
      scenarios,
      strategy,
      disclaimers: [
        'Las tasas de rendimiento son ilustrativas y no constituyen promesa de rentabilidad.',
        'Los montos siguen la moneda de registro de la meta y de los streams.',
        'El ahorro mensual del modelo es la suma de ingresos menos gastos esperados (sin anualizar).',
      ],
    };
  }

  private projectionNarrative(
    key: string,
    ctx: {
      shortfall: number;
      monthsRemaining: number;
      monthlyShortfall: number;
      currentMonthlySavings: number;
      monthlyAmountNeeded: number;
    },
    monthsToTarget: number | null,
    pmt: number,
  ): string {
    if (ctx.shortfall <= 0) {
      return 'La meta ya está alcanzada o superada según saldo actual.';
    }
    if (monthsToTarget == null) {
      return 'Con este aporte y tasa, el modelo no alcanza la meta en el horizonte considerado (revisá aporte o plazo).';
    }
    const base = `A ${pmt.toLocaleString('es-CO', { maximumFractionDigits: 0 })} /mes de aporte modelado y la tasa indicada, el saldo alcanzaría el objetivo en ~${monthsToTarget} meses.`;
    if (key === 'COMBINED' && ctx.monthlyShortfall > 0) {
      return `${base} Aquí se asume que podés aportar lo requerido (${ctx.monthlyAmountNeeded.toLocaleString('es-CO')}/mes) para cumplir el plazo objetivo del modelo (${ctx.monthsRemaining} meses).`;
    }
    if (key === 'ACTUAL') {
      return `${base} Sin asumir rendimiento sobre el saldo (solo flujo).`;
    }
    return base;
  }

  private pickStrategyHint(
    ctx: { monthlyShortfall: number; feasibilityLevel: FeasibilityLevel },
    scenarios: Array<{ key: string; feasibilityLevel: FeasibilityLevel }>,
  ) {
    const base = scenarios.find((s) => s.key === 'BASE');
    if (ctx.monthlyShortfall <= 0) {
      return {
        title: 'Flujo alineado con el plazo',
        detail:
          'El ahorro mensual modelado cubre lo necesario para la meta en el horizonte; mantené disciplina de registro.',
        recommendedScenarioKey: 'BASE' as const,
        feasibility: FeasibilityLevel.REASONABLE,
      };
    }
    return {
      title: 'Priorizar cierre de brecha mensual',
      detail: `Hoy el modelo muestra una brecha de ~${Math.round(ctx.monthlyShortfall).toLocaleString('es-CO')} /mes frente al ritmo requerido. La vía más directa suele ser subir ingresos o bajar gastos en ese orden de magnitud antes de asumir rendimientos altos.`,
      recommendedScenarioKey: 'BASE' as const,
      feasibility: base?.feasibilityLevel ?? ctx.feasibilityLevel,
    };
  }

  /** Contexto numérico compartido entre simulación y proyección. */
  private computeGoalCashContext(goal: {
    targetAmount: unknown;
    currentAmount: unknown;
    targetDate: Date | null;
  }, streams: { flowType: string; expectedAmount: unknown }[]) {
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
    const monthlyShortfall = Math.round(
      monthlyAmountNeeded - currentMonthlySavings,
    );

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

    return {
      totalIncome,
      totalExpense,
      currentMonthlySavings,
      targetAmount,
      currentAmount,
      shortfall,
      monthsRemaining,
      monthlyAmountNeeded,
      monthlyShortfall,
      currentProjectedMonths,
      feasibilityLevel,
    };
  }

  async simulateGoalScenarios(goalId: string) {
    const goal = await this.prisma.savingGoal.findUnique({
      where: { id: goalId },
    });
    if (!goal) throw new Error('Goal not found');

    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId: goal.userId },
    });

    const ctx = this.computeGoalCashContext(goal, streams);
    const {
      currentMonthlySavings,
      targetAmount,
      currentAmount,
      monthsRemaining,
      monthlyAmountNeeded,
      monthlyShortfall,
      currentProjectedMonths,
      feasibilityLevel,
    } = ctx;

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
      ctx.totalIncome,
      ctx.totalExpense,
      currentMonthlySavings,
      ctx.shortfall,
      monthsRemaining,
    );

    return this.getLatestScenarioSnapshot(goalId);
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
          explanation: `Si mantuvieras el ahorro mensual modelado ($${Math.round(currentMonthlySavings).toLocaleString()}), el tiempo estimado para cubrir el faltante sería unos ${projectedMonths} meses, antes del plazo objetivo del modelo.`,
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
        explanation: `Si tus ingresos netos mensuales aumentaran en $${Math.round(monthlyShortfall).toLocaleString()} (≈${incomeIncreasePercent.toFixed(1)}% frente al ingreso modelado), el modelo cerraría la brecha en el plazo objetivo (${originalMonthsRemaining} meses).`,
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
      expExplanation = `Si se redujeran gastos en $${Math.round(monthlyShortfall).toLocaleString()}, el monto superaría o igualaría los gastos totales modelados ($${Math.round(expense).toLocaleString()}); el escenario queda fuera del rango del modelo.`;
    } else {
      expExplanation = `Si los gastos mensuales bajaran en $${Math.round(monthlyShortfall).toLocaleString()} (≈${expenseReductionPercent.toFixed(1)}% del gasto modelado), el modelo alinearía el flujo con el plazo objetivo (${originalMonthsRemaining} meses).`;
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
        explanation: `Escenario combinado (modelo): si el ingreso neto subiera $${Math.round(combIncomeAmount).toLocaleString()} (${combIncomePercent.toFixed(1)}%) y el gasto bajara $${Math.round(combExpenseAmount).toLocaleString()} (${combExpensePercent.toFixed(1)}%), el modelo cerraría la brecha en ${originalMonthsRemaining} meses.`,
        feasibilityLevel: combFeasibility,
        newProjectedMonths: originalMonthsRemaining,
        monthsSaved: 0,
      },
    });
  }
}
