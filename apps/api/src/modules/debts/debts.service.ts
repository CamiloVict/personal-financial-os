import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { buildLeverageAnalysisExplanation } from '../../common/explanation/debts-leverage-explanation';
import { LeverageAnalysisResult, DebtItem } from './debts.contracts';

@Injectable()
export class DebtsService {
  constructor(private prisma: PrismaService) {}

  private mapDebt(d: {
    id: string;
    userId: string;
    name: string;
    debtKind: string | null;
    totalAmount: unknown;
    remainingAmount: unknown;
    interestRate: unknown;
    currency: string;
    monthlyPayment: unknown;
    linkedPositionId: string | null;
    createdAt: Date;
  }): DebtItem {
    return {
      id: d.id,
      userId: d.userId,
      name: d.name,
      type: (d.debtKind as DebtItem['type']) || 'PERSONAL_LOAN',
      totalAmount: Number(d.totalAmount),
      remainingAmount: Number(d.remainingAmount),
      interestRate: Number(d.interestRate ?? 0),
      currency: d.currency,
      monthlyPayment: Number(d.monthlyPayment ?? 0),
      linkedAssetId: d.linkedPositionId,
      createdAt: d.createdAt.toISOString(),
    };
  }

  async getLeverageAnalysis(userId: string): Promise<LeverageAnalysisResult> {
    const userDebts = await this.prisma.debt.findMany({
      where: {
        userId,
        remainingAmount: { gt: 0 },
      },
    });

    const userPositions = await this.prisma.investmentPosition.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    let totalDebt = 0;
    let totalMonthlyPayment = 0;
    let badDebtTotal = 0;
    let goodDebtTotal = 0;
    let totalInterestWeight = 0;

    const badDebts: DebtItem[] = [];
    const goodDebts: any[] = [];

    for (const debt of userDebts) {
      const remaining = Number(debt.remainingAmount) || 0;
      const interestRate = Number(debt.interestRate) || 0;
      const payment = Number(debt.monthlyPayment) || 0;
      const kind = debt.debtKind;

      totalDebt += remaining;
      totalMonthlyPayment += payment;
      totalInterestWeight += remaining * interestRate;

      const linkedAsset = debt.linkedPositionId
        ? userPositions.find((p) => p.id === debt.linkedPositionId)
        : null;

      /**
       * “Buena” deuda = apalancamiento sobre activo que suele apreciar o generar flujo (vivienda, negocio),
       * o deuda ligada a una posición de inversión cuando el tipo no es consumo depreciable.
       * AUTO_LOAN y CREDIT_CARD no se tratan como buen apalancamiento aunque haya activo vinculado (el auto deprecia;
       * el modelo de retorno del activo no aplica como en hipoteca/renta).
       */
      const isConsumptiveOrRevolver =
        kind === 'AUTO_LOAN' || kind === 'CREDIT_CARD';
      const isGoodDebt =
        !isConsumptiveOrRevolver &&
        (Boolean(linkedAsset) ||
          kind === 'MORTGAGE' ||
          kind === 'BUSINESS_LOAN');

      if (isGoodDebt) {
        goodDebtTotal += remaining;

        const assetValue = linkedAsset
          ? Number(linkedAsset.currentEstimatedValue)
          : remaining * 1.2;

        const assetAppreciationRate = 5.0;
        const assetCashflowRate = 6.0;

        const isTaxDeductible = kind === 'MORTGAGE';
        const taxShieldRate = isTaxDeductible ? interestRate * 0.35 : 0;
        const effectiveCostOfDebt = interestRate - taxShieldRate;
        const totalReturnRate = assetAppreciationRate + assetCashflowRate;
        const estimatedEquity = assetValue - remaining;
        const equityRatio = Math.max(0.1, estimatedEquity / assetValue);
        const debtRatio = remaining / assetValue;
        const cashOnCashReturn =
          (totalReturnRate - debtRatio * effectiveCostOfDebt) / equityRatio;
        const isPositiveLeverage = totalReturnRate > effectiveCostOfDebt;

        goodDebts.push({
          ...this.mapDebt(debt as any),
          assetValue,
          assetAppreciationRate,
          assetCashflowRate,
          taxShieldRate,
          effectiveCostOfDebt,
          cashOnCashReturn,
          isPositiveLeverage,
        });
      } else {
        badDebtTotal += remaining;
        badDebts.push(this.mapDebt(debt as any));
      }
    }

    const weightedAverageInterestRate =
      totalDebt > 0 ? totalInterestWeight / totalDebt : 0;

    const totalAssets = userPositions.reduce(
      (acc, p) => acc + Number(p.currentEstimatedValue),
      0,
    );
    const totalAssetsPlusDebtAssumed = Math.max(totalAssets, totalDebt);
    const leverageRatio =
      totalDebt > 0 ? totalDebt / totalAssetsPlusDebtAssumed : 0;

    let leverageHealthStatus: LeverageAnalysisResult['leverageHealthStatus'] =
      'EXCELLENT';
    if (leverageRatio > 0.7 || badDebtTotal > goodDebtTotal)
      leverageHealthStatus = 'CRITICAL';
    else if (leverageRatio > 0.5 || weightedAverageInterestRate > 15)
      leverageHealthStatus = 'WARNING';
    else if (leverageRatio > 0.2) leverageHealthStatus = 'GOOD';

    const explanation = buildLeverageAnalysisExplanation({
      debtCount: userDebts.length,
      positionCount: userPositions.length,
    });

    return {
      userId,
      totalDebt,
      totalMonthlyPayment,
      badDebtTotal,
      goodDebtTotal,
      badDebts,
      goodDebts,
      weightedAverageInterestRate,
      leverageRatio,
      leverageHealthStatus,
      explanation,
    };
  }

  async getAllDebts(userId: string): Promise<DebtItem[]> {
    const rows = await this.prisma.debt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((d) => this.mapDebt(d as any));
  }

  async createDebt(debt: Record<string, unknown>) {
    const {
      type,
      linkedAssetId,
      userId,
      name,
      totalAmount,
      remainingAmount,
      currency,
      interestRate,
      dueDate,
      monthlyPayment,
    } = debt as any;

    return this.prisma.debt.create({
      data: {
        userId,
        name,
        totalAmount,
        remainingAmount,
        currency: currency || 'USD',
        interestRate: interestRate ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        monthlyPayment: monthlyPayment ?? null,
        debtKind: type ?? null,
        linkedPositionId: linkedAssetId ?? null,
      },
    });
  }
}
