import { Injectable } from '@nestjs/common';
import { createNode, emptyFinancialExplanation } from '@personal-finance-os/explanation';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AllocatorResult, AllocationRecommendation } from './allocator.contracts';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AllocatorService {
  constructor(private prisma: PrismaService) {}

  async generateAllocationPlan(
    userId: string,
    availableCapital: number,
  ): Promise<AllocatorResult> {
    const recommendations: AllocationRecommendation[] = [];
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
          recommendations.push({
            id: uuidv4(),
            type: 'TAX_OPTIMIZATION',
            title: 'Apertura y Fondeo de Cuenta AFC',
            description: `Depositar capital en una cuenta AFC te otorga un beneficio fiscal directo. El dinero se considera Renta Exenta.`,
            suggestedAmount: Math.round(suggestedAmount),
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
          (recommendations.find((r) => r.type === 'TAX_OPTIMIZATION')
            ?.suggestedAmount || 0);
        const suggestedAmount = Math.min(unallocatedCapital, remainingLimit);

        if (suggestedAmount > 0) {
          const expectedTaxSaved = suggestedAmount * estimatedMarginalRate;
          recommendations.push({
            id: uuidv4(),
            type: 'TAX_OPTIMIZATION',
            title: 'Aporte a Fondo de Pensión Voluntaria (FPV)',
            description: `Aprovecha el límite restante de rentas exentas aportando a un FPV.`,
            suggestedAmount: Math.round(suggestedAmount),
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

        recommendations.push({
          id: uuidv4(),
          type: 'DEBT_REDUCTION',
          title: `Abono a Capital: ${debt.name}`,
          description: `Pagar esta deuda de alto costo (Tasa: ${rate}%) te ahorra intereses garantizados.`,
          suggestedAmount: Math.round(suggestedAmount),
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

      recommendations.push({
        id: uuidv4(),
        type: 'GOAL_ACCELERATION',
        title: `Acelerar Meta: ${goal.name}`,
        description: `Asignar capital a esta meta te acerca a tu objetivo${
          goal.targetDate
            ? ` establecido para ${goal.targetDate.toLocaleDateString()}`
            : ''
        }.`,
        suggestedAmount: Math.round(suggestedAmount),
        expectedReturnAmount: 0,
        returnPercentage: 0,
        priorityScore: 70,
        actionData: { goalId: goal.id },
      });
      unallocatedCapital -= suggestedAmount;
    }

    recommendations.sort((a, b) => b.priorityScore - a.priorityScore);

    const explanation = {
      ...emptyFinancialExplanation(
        'allocator.capital_plan',
        'Asignación heurística de capital disponible',
      ),
      summary:
        'Prioriza beneficios fiscales (AFC/FPV), luego deudas caras (>15%), luego metas abiertas por fecha.',
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
            'Sugerencias AFC/FPV limitadas a 30% del ingreso anual estimado (heurística del allocator).',
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

    return {
      userId,
      availableCapital,
      unallocatedCapital,
      recommendations,
      explanation,
    };
  }
}
