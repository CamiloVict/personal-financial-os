import { Injectable } from '@nestjs/common';
import { createNode, emptyFinancialExplanation } from '@personal-finance-os/explanation';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ConfidenceService } from '../confidence/confidence.service';
import { AllocatorResult, AllocationScenario } from './allocator.contracts';
import { v4 as uuidv4 } from 'uuid';

/** Reparte `total` en `parts` enteros que suman exactamente `total`. */
function splitIntegerEven(total: number, parts: number): number[] {
  if (parts <= 0 || total <= 0) return [];
  const n = Math.min(parts, total);
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

@Injectable()
export class AllocatorService {
  constructor(
    private prisma: PrismaService,
    private readonly confidenceService: ConfidenceService,
  ) {}

  async simulateCapitalAllocation(
    userId: string,
    availableCapital: number,
  ): Promise<AllocatorResult> {
    const scenarios: AllocationScenario[] = [];
    let unallocatedCapital = availableCapital;

    const year = new Date().getFullYear();
    const userProfile = await this.prisma.taxProfile.findFirst({
      where: { userId, taxYear: year },
    });

    const incomeStreams = await this.prisma.cashflowStream.findMany({
      where: { userId, flowType: 'INCOME' },
    });
    const totalAnnualIncome = incomeStreams.reduce(
      (acc, s) => acc + Number(s.expectedAmount) * 12,
      0,
    );

    if (userProfile && totalAnnualIncome > 0) {
      const estimatedMarginalRate = 0.35;
      const limitExemptions = totalAnnualIncome * 0.3;

      if (!userProfile.hasAFC) {
        const suggestedAmount = Math.min(unallocatedCapital, limitExemptions);
        if (suggestedAmount > 0) {
          const expectedTaxSaved = suggestedAmount * estimatedMarginalRate;
          scenarios.push({
            id: uuidv4(),
            type: 'IMPACT_TAX_SHELTER',
            title: 'Escenario: aportes a cuenta AFC (modelo)',
            description: `Si destinaras $${Math.round(suggestedAmount).toLocaleString()} a un AFC elegible según las reglas del modelo, el ahorro tributario estimado sería de $${Math.round(expectedTaxSaved).toLocaleString()} (tasa marginal asumida ${estimatedMarginalRate * 100}%).`,
            modeledAmount: Math.round(suggestedAmount),
            expectedReturnAmount: Math.round(expectedTaxSaved),
            returnPercentage: estimatedMarginalRate * 100,
            priorityScore: 95,
            actionData: { action: 'ENABLE_AFC' },
          });
          unallocatedCapital -= suggestedAmount;
        }
      }

      if (!userProfile.hasVoluntaryPension && unallocatedCapital > 0) {
        const remainingLimit =
          limitExemptions -
          (scenarios.find((r) => r.type === 'IMPACT_TAX_SHELTER')
            ?.modeledAmount || 0);
        const suggestedAmount = Math.min(unallocatedCapital, remainingLimit);

        if (suggestedAmount > 0) {
          const expectedTaxSaved = suggestedAmount * estimatedMarginalRate;
          scenarios.push({
            id: uuidv4(),
            type: 'IMPACT_TAX_SHELTER',
            title: 'Escenario: aportes a FPV (modelo)',
            description: `Si aportaras $${Math.round(suggestedAmount).toLocaleString()} a pensión voluntaria dentro del tope del modelo, el efecto fiscal estimado sería un ahorro de $${Math.round(expectedTaxSaved).toLocaleString()}.`,
            modeledAmount: Math.round(suggestedAmount),
            expectedReturnAmount: Math.round(expectedTaxSaved),
            returnPercentage: estimatedMarginalRate * 100,
            priorityScore: 90,
            actionData: { action: 'ENABLE_FPV' },
          });
          unallocatedCapital -= suggestedAmount;
        }
      }
    }

    const userDebts = await this.prisma.debt.findMany({
      where: { userId, remainingAmount: { gt: 0 } },
    });
    userDebts.sort(
      (a, b) => Number(b.interestRate || 0) - Number(a.interestRate || 0),
    );

    for (const debt of userDebts) {
      if (unallocatedCapital <= 0) break;
      const rate = Number(debt.interestRate || 0);

      if (rate > 15) {
        const remainingAmount = Number(debt.remainingAmount);
        const suggestedAmount = Math.min(unallocatedCapital, remainingAmount);
        const expectedInterestSaved = suggestedAmount * (rate / 100);

        scenarios.push({
          id: uuidv4(),
          type: 'IMPACT_DEBT_PAYDOWN',
          title: `Escenario: abono a «${debt.name}»`,
          description: `Si abonaras $${Math.round(suggestedAmount).toLocaleString()} a esta obligación al ${rate}% EA en el modelo, el interés evitado anualizado estimado sería $${Math.round(expectedInterestSaved).toLocaleString()}.`,
          modeledAmount: Math.round(suggestedAmount),
          expectedReturnAmount: Math.round(expectedInterestSaved),
          returnPercentage: rate,
          priorityScore: 85 + rate / 2,
          actionData: { debtId: debt.id },
        });
        unallocatedCapital -= suggestedAmount;
      }
    }

    const userGoals = await this.prisma.savingGoal.findMany({
      where: { userId },
    });
    const openGoals = userGoals.filter(
      (g) => Number(g.currentAmount) < Number(g.targetAmount),
    );
    openGoals.sort((a, b) => {
      const ta = a.targetDate?.getTime() ?? Number.POSITIVE_INFINITY;
      const tb = b.targetDate?.getTime() ?? Number.POSITIVE_INFINITY;
      return ta - tb;
    });

    for (const goal of openGoals) {
      if (unallocatedCapital <= 0) break;
      const shortfall =
        Number(goal.targetAmount) - Number(goal.currentAmount);
      const suggestedAmount = Math.min(unallocatedCapital, shortfall);

      scenarios.push({
        id: uuidv4(),
        type: 'IMPACT_GOAL_FUNDING',
        title: `Escenario: aporte a meta «${goal.name}»`,
        description: `Si asignaras $${Math.round(suggestedAmount).toLocaleString()} a esta meta${
          goal.targetDate
            ? ` con fecha objetivo ${goal.targetDate.toLocaleDateString()}`
            : ''
        }, el modelo solo registra el monto; no proyecta rendimiento adicional.`,
        modeledAmount: Math.round(suggestedAmount),
        expectedReturnAmount: 0,
        returnPercentage: 0,
        priorityScore: 70,
        actionData: { goalId: goal.id },
      });
      unallocatedCapital -= suggestedAmount;
    }

    const surplusBeforeSplit = unallocatedCapital;
    let surplusAlternatives: AllocationScenario[] | undefined;
    /** Umbral mínimo para sugerir reparto del sobrante (evita ruido con montos triviales). */
    const MIN_SURPLUS_TO_SPLIT = 100;
    const illustrativeAnnualPct = 7;

    if (surplusBeforeSplit >= MIN_SURPLUS_TO_SPLIT) {
      const surplus = Math.round(surplusBeforeSplit);
      let liq = Math.round(surplus * 0.25);
      let inv = Math.round(surplus * 0.45);
      let goalPool = surplus - liq - inv;
      if (goalPool < 0) {
        goalPool = 0;
        inv = Math.max(0, surplus - liq);
      }

      if (openGoals.length === 0) {
        inv += goalPool;
        goalPool = 0;
      }

      scenarios.push({
        id: uuidv4(),
        type: 'INVESTMENT_OPPORTUNITY',
        title: 'Sobrante (modelo): colchón de liquidez',
        description: `Parte ilustrativa del capital que quedaba libre (${Math.round(liq).toLocaleString()}): efectivo o instrumentos muy líquidos. Sin rendimiento modelado.`,
        modeledAmount: Math.round(liq),
        expectedReturnAmount: 0,
        returnPercentage: 0,
        priorityScore: 63,
        actionData: { bucket: 'SURPLUS_LIQUIDITY' },
      });

      scenarios.push({
        id: uuidv4(),
        type: 'INVESTMENT_OPPORTUNITY',
        title: 'Sobrante (modelo): inversión diversificada ilustrativa',
        description: `${Math.round(inv).toLocaleString()} del sobrante en cartera diversificada; el modelo usa ${illustrativeAnnualPct}% anual solo como referencia, no proyección.`,
        modeledAmount: Math.round(inv),
        expectedReturnAmount: Math.round(inv * (illustrativeAnnualPct / 100)),
        returnPercentage: illustrativeAnnualPct,
        priorityScore: 62,
        actionData: { bucket: 'SURPLUS_INVEST' },
      });

      if (goalPool > 0 && openGoals.length > 0) {
        const n = Math.min(openGoals.length, 3);
        const amounts = splitIntegerEven(Math.round(goalPool), n);
        for (let i = 0; i < amounts.length; i++) {
          const g = openGoals[i]!;
          const amt = amounts[i] ?? 0;
          if (amt <= 0 || !g) continue;
          scenarios.push({
            id: uuidv4(),
            type: 'IMPACT_GOAL_FUNDING',
            title: `Sobrante (modelo): aporte adicional a «${g.name}»`,
            description: `Tras cubrir el déficit de la meta en el modelo, podés destinar capital extra para adelantar el objetivo o mantener colchón etiquetado a «${g.name}».`,
            modeledAmount: amt,
            expectedReturnAmount: 0,
            returnPercentage: 0,
            priorityScore: 61,
            actionData: { goalId: g.id, supplementalToGoal: true },
          });
        }
      }

      unallocatedCapital = 0;

      surplusAlternatives = [
        {
          id: uuidv4(),
          type: 'INVESTMENT_OPPORTUNITY',
          title: 'Otra forma (referencia): 100% del sobrante a liquidez',
          description: `Los ${Math.round(surplus).toLocaleString()} que quedaban sin asignar tras fiscal/deuda/metas mínimas, enteros en liquidez. Es una mentalidad distinta al reparto en varias tarjetas de arriba: no sumes ambas lógicas.`,
          modeledAmount: Math.round(surplus),
          expectedReturnAmount: 0,
          returnPercentage: 0,
          priorityScore: 0,
          actionData: { surplusAlternative: true },
        },
        {
          id: uuidv4(),
          type: 'INVESTMENT_OPPORTUNITY',
          title: 'Otra forma (referencia): 100% del sobrante a inversión ilustrativa',
          description: `Todo el remanente (${Math.round(surplus).toLocaleString()}) a activos con riesgo asumido; efecto anual ilustrativo ${illustrativeAnnualPct}% en el modelo.`,
          modeledAmount: Math.round(surplus),
          expectedReturnAmount: Math.round(
            surplus * (illustrativeAnnualPct / 100),
          ),
          returnPercentage: illustrativeAnnualPct,
          priorityScore: 0,
          actionData: { surplusAlternative: true },
        },
      ];

      const firstGoal = openGoals[0];
      if (firstGoal) {
        surplusAlternatives.push({
          id: uuidv4(),
          type: 'IMPACT_GOAL_FUNDING',
          title: `Otra forma (referencia): 100% del sobrante a «${firstGoal.name}»`,
          description: `Concentrar todo el remanente acelera esa meta; contrastá con otras metas abiertas y con tu colchón de liquidez.`,
          modeledAmount: Math.round(surplus),
          expectedReturnAmount: 0,
          returnPercentage: 0,
          priorityScore: 0,
          actionData: {
            goalId: firstGoal.id,
            surplusAlternative: true,
          },
        });
      }

      if (openGoals.length >= 2) {
        const names = openGoals
          .slice(0, 4)
          .map((g) => `«${g.name}»`)
          .join(', ');
        surplusAlternatives.push({
          id: uuidv4(),
          type: 'INVESTMENT_OPPORTUNITY',
          title: 'Otra forma (referencia): repartir el sobrante entre varias metas',
          description: `Podés distribuir los ${Math.round(surplus).toLocaleString()} entre metas abiertas (${names}${openGoals.length > 4 ? '…' : ''}) según plazo e importancia; el modelo no fija porcentajes aquí.`,
          modeledAmount: Math.round(surplus),
          expectedReturnAmount: 0,
          returnPercentage: 0,
          priorityScore: 0,
          actionData: { surplusAlternative: true, multiGoalSplit: true },
        });
      }
    }

    scenarios.sort((a, b) => b.priorityScore - a.priorityScore);

    const explanation = {
      ...emptyFinancialExplanation(
        'allocator.capital_scenarios',
        'Simulación heurística de asignación de capital',
      ),
      summary:
        'El orden del modelo aplica primero supuestos de renta exenta (AFC/FPV), luego deudas con tasa >15% EA y luego metas abiertas; si sobra capital, propone un reparto ilustrativo (liquidez / inversión / metas extra) y alternativas de referencia; es ilustrativo, no una orden de prioridad personal.',
      inputs: [
        createNode({
          kind: 'input',
          label: 'Capital disponible a asignar',
          value: availableCapital,
        }),
        createNode({
          kind: 'input',
          label: 'Tasa marginal estimada AFC/FPV',
          description: '35% fija en modelo',
          value: 35,
        }),
      ],
      steps: [
        createNode({
          kind: 'rule',
          label: 'Tope rentas exentas',
          description:
            'Tope AFC/FPV en el modelo: 30% del ingreso anual estimado.',
          ruleRef: 'ALLOC-TAX-CAP-30',
        }),
        createNode({
          kind: 'rule',
          label: 'Deuda prioritaria',
          description: 'Solo deudas con tasa > 15% EA.',
          ruleRef: 'ALLOC-DEBT-15',
        }),
        createNode({
          kind: 'rule',
          label: 'Sobrante tras metas',
          description:
            'Si queda capital libre, reparto orientativo ~25% liquidez, ~45% inversión ilustrativa y el resto aportes adicionales a hasta 3 metas (por plazo). Las “otras formas” son mutuamente excluyentes entre sí y con ese reparto.',
          ruleRef: 'ALLOC-SURPLUS-SPLIT',
        }),
      ],
      assumptions: [
        'Ingreso anual = suma de streams INCOME × 12 sin ajuste TRM.',
        'No se modelan límites legales detallados de AFC/FPV del Estatuto.',
      ],
      missingData: [
        'Liquidez de emergencia deseada y otros compromisos no registrados en la app.',
      ],
      normativeRefs: [],
    };

    const confidence =
      await this.confidenceService.evaluateAllocator(userId);

    const engineNotes: string[] = [];
    const primary = scenarios[0];
    if (primary && availableCapital > 0) {
      const share = primary.modeledAmount / availableCapital;
      if (primary.type === 'IMPACT_TAX_SHELTER' && share >= 0.42) {
        engineNotes.push(
          'La asignación sugerida concentra buena parte del capital en ahorro fiscal (AFC/FPV en el modelo), con menor liquidez inmediata: contrasta con tu colchón en Flujo y cuotas en Deudas antes de ejecutar.',
        );
      }
    }
    if (
      surplusBeforeSplit >= MIN_SURPLUS_TO_SPLIT &&
      surplusBeforeSplit >= availableCapital * 0.15
    ) {
      engineNotes.push(
        'Hubo un sobrante relevante después de cubrir metas/deuda/fiscal: revisá las tarjetas “Sobrante (modelo)” y la sección de alternativas al final; no combines mentalidades distintas (reparto vs 100% en una sola idea).',
      );
    }

    return {
      userId,
      availableCapital,
      unallocatedCapital,
      scenarios,
      surplusAlternatives:
        surplusAlternatives && surplusAlternatives.length > 0
          ? surplusAlternatives
          : undefined,
      explanation,
      confidence,
      engineNotes: engineNotes.length ? engineNotes : undefined,
    };
  }

  private readonly snapshotTtlMs = 30 * 24 * 60 * 60 * 1000;

  async saveAllocatorSnapshot(
    userId: string,
    result: AllocatorResult,
  ): Promise<{ savedAt: string; expiresAt: string }> {
    await this.prisma.savedAllocatorAnalysis.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    const expiresAt = new Date(Date.now() + this.snapshotTtlMs);
    await this.prisma.$transaction([
      this.prisma.savedAllocatorAnalysis.deleteMany({ where: { userId } }),
      this.prisma.savedAllocatorAnalysis.create({
        data: {
          userId,
          result: result as object,
          expiresAt,
        },
      }),
    ]);
    const row = await this.prisma.savedAllocatorAnalysis.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      savedAt: row!.createdAt.toISOString(),
      expiresAt: row!.expiresAt.toISOString(),
    };
  }

  async getLatestAllocatorSnapshot(userId: string): Promise<{
    plan: AllocatorResult;
    savedAt: string;
    expiresAt: string;
  } | null> {
    await this.prisma.savedAllocatorAnalysis.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
    const row = await this.prisma.savedAllocatorAnalysis.findFirst({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return null;
    return {
      plan: row.result as unknown as AllocatorResult,
      savedAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
    };
  }

  async deleteAllocatorSnapshot(userId: string): Promise<void> {
    await this.prisma.savedAllocatorAnalysis.deleteMany({ where: { userId } });
  }
}
