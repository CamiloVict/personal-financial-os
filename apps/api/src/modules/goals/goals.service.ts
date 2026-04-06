import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FeasibilityLevel,
  GoalUtilityCadence,
  GoalUtilityMode,
  Prisma,
  ScenarioType,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ConversionService } from '../currency/conversion.service';
import {
  annualToMonthlyRate,
  cashflowStreamToMonthlyEquivalent,
  DEFAULT_PROJECTION_SCENARIOS,
  monthsRemainingForGoal,
  monthsToReachTarget,
  splitContributionVsGrowth,
  utilityImpliedMonthlySavings,
} from './goal-projection.util';

const GOAL_WRITABLE_KEYS = [
  'name',
  'targetAmount',
  'currentAmount',
  'targetDate',
  'color',
  'icon',
  'currency',
  'utilityMode',
  'utilityCadence',
  'utilityValue',
] as const;

function pickGoalBody(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of GOAL_WRITABLE_KEYS) {
    if (k in body && body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

function normalizeGoalCurrency(c: unknown): string {
  const s = String(c ?? 'COP').toUpperCase();
  return s === 'USD' ? 'USD' : 'COP';
}

function normStreamCurrency(c: unknown): string {
  return String(c ?? 'USD').trim().toUpperCase();
}

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversion: ConversionService,
  ) {}

  findAllGoals(userId?: string) {
    return this.prisma.savingGoal.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneGoal(id: string, userId: string) {
    const g = await this.prisma.savingGoal.findFirst({
      where: { id, userId },
    });
    if (!g) throw new NotFoundException('Meta no encontrada');
    return g;
  }

  createGoal(payload: Record<string, unknown>) {
    const raw = pickGoalBody(payload);
    const currency = normalizeGoalCurrency(raw.currency);
    const utilityMode = (raw.utilityMode as GoalUtilityMode) ?? GoalUtilityMode.NONE;
    const utilityCadence =
      (raw.utilityCadence as GoalUtilityCadence) ?? GoalUtilityCadence.MANUAL;
    let utilityValue = Number(raw.utilityValue ?? 0);
    if (utilityMode === GoalUtilityMode.PERCENT)
      utilityValue = Math.min(100, Math.max(0, utilityValue));

    return this.prisma.savingGoal.create({
      data: {
        userId: payload.userId as string,
        name: String(raw.name ?? ''),
        targetAmount: Number(raw.targetAmount ?? 0),
        currentAmount: Number(raw.currentAmount ?? 0),
        targetDate: raw.targetDate
          ? new Date(raw.targetDate as string)
          : null,
        color: raw.color != null ? String(raw.color) : null,
        icon: raw.icon != null ? String(raw.icon) : null,
        currency,
        utilityMode,
        utilityCadence,
        utilityValue,
      },
    });
  }

  async updateGoal(id: string, userId: string, body: Record<string, unknown>) {
    const existing = await this.prisma.savingGoal.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Meta no encontrada');
    const raw = pickGoalBody(body);
    const data: Record<string, unknown> = {};

    if ('name' in raw) data.name = String(raw.name);
    if ('targetAmount' in raw) data.targetAmount = Number(raw.targetAmount);
    if ('currentAmount' in raw) data.currentAmount = Number(raw.currentAmount);
    if ('targetDate' in raw)
      data.targetDate = raw.targetDate
        ? new Date(raw.targetDate as string)
        : null;
    if ('color' in raw) data.color = raw.color != null ? String(raw.color) : null;
    if ('icon' in raw) data.icon = raw.icon != null ? String(raw.icon) : null;
    if ('currency' in raw) data.currency = normalizeGoalCurrency(raw.currency);
    if ('utilityMode' in raw) data.utilityMode = raw.utilityMode as GoalUtilityMode;
    if ('utilityCadence' in raw)
      data.utilityCadence = raw.utilityCadence as GoalUtilityCadence;

    if ('utilityValue' in raw || 'utilityMode' in raw) {
      const nextMode = (
        'utilityMode' in raw ? raw.utilityMode : existing.utilityMode
      ) as GoalUtilityMode;
      const vIn =
        'utilityValue' in raw ? Number(raw.utilityValue) : Number(existing.utilityValue);
      data.utilityValue =
        nextMode === GoalUtilityMode.PERCENT
          ? Math.min(100, Math.max(0, vIn))
          : Math.max(0, vIn);
    }

    if (Object.keys(data).length === 0) return existing;
    return this.prisma.savingGoal.update({
      where: { id },
      data: data as any,
    });
  }

  async listProgressLogs(goalId: string, userId: string) {
    await this.findOneGoal(goalId, userId);
    const rows = await this.prisma.goalProgressLog.findMany({
      where: { goalId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((l) => ({
      id: l.id,
      goalId: l.goalId,
      note: l.note,
      amountDelta: Number(l.amountDelta),
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async addProgressLog(
    goalId: string,
    userId: string,
    body: Record<string, unknown>,
  ) {
    const goal = await this.findOneGoal(goalId, userId);
    const note = String(body.note ?? '').trim();
    if (!note) throw new BadRequestException('La nota no puede estar vacía');
    const amountDelta = Math.max(0, Number(body.amountDelta ?? 0));
    if (!Number.isFinite(amountDelta)) {
      throw new BadRequestException('Monto inválido');
    }

    return this.prisma.$transaction(async (tx) => {
      const log = await tx.goalProgressLog.create({
        data: {
          goalId,
          note,
          amountDelta: new Prisma.Decimal(amountDelta),
        },
      });
      if (amountDelta > 0) {
        const next = Number(goal.currentAmount) + amountDelta;
        await tx.savingGoal.update({
          where: { id: goalId },
          data: { currentAmount: new Prisma.Decimal(next) },
        });
      }
      return {
        id: log.id,
        goalId: log.goalId,
        note: log.note,
        amountDelta: Number(log.amountDelta),
        createdAt: log.createdAt.toISOString(),
      };
    });
  }

  async getLatestScenarioSnapshot(goalId: string, userId: string) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new NotFoundException('Meta no encontrada');
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
      where: { userId, isActive: true },
    });
    const ctx = await this.computeGoalCashContext(goal, streams, new Date());
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
        cashflowMonthlySavings: ctx.cashflowMonthlySavings,
        utilityMonthly: ctx.utilityMonthly,
        goalCurrency: ctx.goalCurrency,
        monthlyAmountNeeded: ctx.monthlyAmountNeeded,
        monthlyShortfall: ctx.monthlyShortfall,
        monthsRemainingModel: ctx.monthsRemaining,
        horizonOpenEnded: ctx.horizonOpenEnded,
        targetInPast: ctx.targetInPast,
        cashflowMixedCurrency: ctx.cashflowMixedCurrency,
        savingsFxConversionApplied: ctx.savingsFxConversionApplied,
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
        'Los montos objetivo/saldo siguen la moneda de la meta. Se usan todos los flujos activos (ingreso y gasto): equivalente mensual por frecuencia y, si hace falta, conversión a la moneda de la meta con FX a la fecha del cálculo. Sin cotización, ese flujo no entra en el total.',
        'El ahorro mensual del modelo suma (ingresos − gastos) más utilidades hacia la meta solo si configuraste monto o % trimestral; con cadencia manual actualizá el saldo a mano.',
        'Sin fecha objetivo, el “meses en el modelo” son 12 para estimar un ritmo mensual sugerido.',
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

  /**
   * Equivalente mensual del flujo en la moneda de la meta (FX a `fxAsOf` si hace falta).
   * Sin cotización: devuelve 0 para no contaminar el total.
   */
  private async streamMonthlyInGoalCurrency(
    s: {
      expectedAmount: unknown;
      currency?: string;
      frequency?: string;
      customFrequencyMonths?: number | null;
    },
    goalCurrency: string,
    fxAsOf: Date,
  ): Promise<{ amount: number; converted: boolean }> {
    const monthly = cashflowStreamToMonthlyEquivalent(
      Number(s.expectedAmount),
      String(s.frequency ?? 'MONTHLY'),
      s.customFrequencyMonths,
    );
    if (!Number.isFinite(monthly) || monthly === 0) {
      return { amount: 0, converted: false };
    }
    const from = normStreamCurrency(s.currency);
    if (from === goalCurrency.toUpperCase()) {
      return { amount: monthly, converted: false };
    }
    try {
      const r = await this.conversion.convert(monthly, from, goalCurrency, fxAsOf);
      return { amount: r.amount, converted: true };
    } catch {
      return { amount: 0, converted: false };
    }
  }

  /** Contexto numérico compartido entre simulación y proyección. */
  private async computeGoalCashContext(
    goal: {
      targetAmount: unknown;
      currentAmount: unknown;
      targetDate: Date | null;
      utilityMode?: GoalUtilityMode;
      utilityCadence?: GoalUtilityCadence;
      utilityValue?: unknown;
      currency?: string | null;
    },
    streams: {
      flowType: string;
      expectedAmount: unknown;
      currency?: string;
      frequency?: string;
      customFrequencyMonths?: number | null;
    }[],
    fxAsOf: Date,
  ) {
    const goalCurrency = normalizeGoalCurrency(goal.currency);
    /** Siempre todos los flujos activos: cada uno se lleva a equivalente mensual y a la moneda de la meta.
     *  (Antes solo se usaban flujos en la misma moneda que la meta y se ignoraba el resto → capacidad de ahorro falsa.) */
    const scope = streams;
    const ledgerCurrencies = new Set(
      streams.map((s) => normStreamCurrency(s.currency)),
    );
    const cashflowMixedCurrency =
      streams.length > 0 &&
      (ledgerCurrencies.size > 1 ||
        [...ledgerCurrencies].some((c) => c !== goalCurrency.toUpperCase()));

    const incomeStreams = scope.filter((s) => s.flowType === 'INCOME');
    const expenseStreams = scope.filter((s) => s.flowType === 'EXPENSE');

    let totalIncome = 0;
    let totalExpense = 0;
    let savingsFxConversionApplied = false;
    for (const s of incomeStreams) {
      const { amount, converted } = await this.streamMonthlyInGoalCurrency(
        s,
        goalCurrency,
        fxAsOf,
      );
      if (converted) savingsFxConversionApplied = true;
      totalIncome += amount;
    }
    for (const s of expenseStreams) {
      const { amount, converted } = await this.streamMonthlyInGoalCurrency(
        s,
        goalCurrency,
        fxAsOf,
      );
      if (converted) savingsFxConversionApplied = true;
      totalExpense += amount;
    }

    const cashflowMonthlySavings = totalIncome - totalExpense;
    const utilityMonthly = utilityImpliedMonthlySavings({
      mode: goal.utilityMode ?? GoalUtilityMode.NONE,
      cadence: goal.utilityCadence ?? GoalUtilityCadence.MANUAL,
      utilityValue: Number(goal.utilityValue ?? 0),
      currentAmount: Number(goal.currentAmount ?? 0),
    });
    const currentMonthlySavings = cashflowMonthlySavings + utilityMonthly;

    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount || 0);
    const shortfall = targetAmount - currentAmount;

    const now = new Date();
    const targetDateObj = goal.targetDate
      ? new Date(goal.targetDate)
      : null;
    const {
      months: monthsRemaining,
      openEnded: horizonOpenEnded,
      targetInPast,
    } = monthsRemainingForGoal(targetDateObj, now);

    const monthlyAmountNeeded =
      shortfall > 0
        ? Math.round(shortfall / monthsRemaining)
        : 0;
    const monthlyShortfall = Math.round(
      monthlyAmountNeeded - currentMonthlySavings,
    );

    let currentProjectedMonths: number | null = null;
    if (shortfall > 0 && currentMonthlySavings > 0) {
      currentProjectedMonths = Math.ceil(shortfall / currentMonthlySavings);
    } else if (shortfall <= 0) {
      currentProjectedMonths = 0;
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
      cashflowMonthlySavings,
      utilityMonthly,
      goalCurrency,
      currentMonthlySavings,
      targetAmount,
      currentAmount,
      shortfall,
      monthsRemaining,
      horizonOpenEnded,
      targetInPast,
      cashflowMixedCurrency,
      savingsFxConversionApplied,
      monthlyAmountNeeded,
      monthlyShortfall,
      currentProjectedMonths,
      feasibilityLevel,
    };
  }

  async simulateGoalScenarios(goalId: string, userId: string) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new NotFoundException('Meta no encontrada');

    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId: goal.userId, isActive: true },
    });

    const ctx = await this.computeGoalCashContext(goal, streams, new Date());
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

    return this.getLatestScenarioSnapshot(goalId, userId);
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
