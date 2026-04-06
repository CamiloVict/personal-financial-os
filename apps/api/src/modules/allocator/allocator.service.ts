import { Injectable } from '@nestjs/common';
import { createNode, emptyFinancialExplanation } from '@personal-finance-os/explanation';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ConfidenceService } from '../confidence/confidence.service';
import { AllocatorResult, AllocationScenario } from './allocator.contracts';
import { v4 as uuidv4 } from 'uuid';

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

    scenarios.sort((a, b) => b.priorityScore - a.priorityScore);

    const explanation = {
      ...emptyFinancialExplanation(
        'allocator.capital_scenarios',
        'Simulación heurística de asignación de capital',
      ),
      summary:
        'El orden del modelo aplica primero supuestos de renta exenta (AFC/FPV), luego deudas con tasa >15% EA y luego metas abiertas; es ilustrativo, no una orden de prioridad personal.',
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

    return {
      userId,
      availableCapital,
      unallocatedCapital,
      scenarios,
      explanation,
      confidence,
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
