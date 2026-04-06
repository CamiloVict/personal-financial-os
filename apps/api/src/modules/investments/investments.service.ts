import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  bucketEventsByMonth,
  mergePortfolioValueSeries,
  unionMonthKeys,
  type PositionForHistory,
} from './portfolio-analytics.util';

export type PortfolioAnalyticsResponse = {
  generatedAt: string;
  totals: {
    positionCount: number;
    totalEstimatedValue: number;
    totalInitialCapital: number;
    unrealizedGain: number;
    returnPct: number | null;
  };
  compositionByType: Array<{
    typeId: string;
    typeName: string;
    value: number;
    sharePct: number;
    generatesCashflow: boolean;
  }>;
  profitFlow: {
    lifetimeWithdrawn: number;
    lifetimeReinvested: number;
    netTakenOut: number;
  };
  capitalFlow: {
    lifetimeContributions: number;
    lifetimeWithdrawals: number;
    netContributed: number;
  };
  monthly: {
    months: string[];
    profitWithdrawn: number[];
    profitReinvested: number[];
    contributions: number[];
    capitalWithdrawals: number[];
  };
  valueHistory: Array<{ date: string; value: number }>;
  linkedDebts: Array<{
    debtId: string;
    debtName: string;
    positionId: string;
    positionName: string;
    positionEstimatedValue: number;
    remainingAmount: number;
    currency: string;
    debtKind: string | null;
    /** remaining / valor posición (orientativo). */
    debtToValueRatio: number | null;
  }>;
  disclaimers: string[];
};

@Injectable()
export class InvestmentsService {
  constructor(private readonly prisma: PrismaService) {}

  getTypes(userId?: string) {
    if (!userId) {
      return this.prisma.investmentTypeDefinition.findMany({
        orderBy: { name: 'asc' },
      });
    }
    return this.prisma.investmentTypeDefinition.findMany({
      where: {
        OR: [{ isSystem: true }, { userId: null }, { userId }],
      },
      orderBy: { name: 'asc' },
    });
  }

  createType(payload: Record<string, unknown>) {
    return this.prisma.investmentTypeDefinition.create({
      data: payload as any,
    });
  }

  async updateType(userId: string, id: string, payload: Record<string, unknown>) {
    const row = await this.prisma.investmentTypeDefinition.findFirst({
      where: { id, userId, isSystem: false },
    });
    if (!row) throw new NotFoundException('Tipo de inversión no encontrado');
    return this.prisma.investmentTypeDefinition.update({
      where: { id },
      data: payload as any,
    });
  }

  async deleteType(userId: string, id: string) {
    const row = await this.prisma.investmentTypeDefinition.findFirst({
      where: { id, userId, isSystem: false },
    });
    if (!row) throw new NotFoundException('Tipo de inversión no encontrado');
    return this.prisma.investmentTypeDefinition.delete({ where: { id } });
  }

  getPositions(userId?: string) {
    return this.prisma.investmentPosition.findMany({
      where: userId ? { userId } : undefined,
      include: {
        type: true,
        _count: { select: { events: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  createPosition(payload: Record<string, unknown>) {
    return this.prisma.investmentPosition.create({
      data: {
        ...payload,
        startDate: new Date(payload.startDate as string),
      } as any,
    });
  }

  async updatePosition(userId: string, id: string, payload: Record<string, unknown>) {
    const existing = await this.prisma.investmentPosition.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Posición no encontrada');
    const data: any = { ...payload };
    if (payload.startDate) data.startDate = new Date(payload.startDate as string);
    return this.prisma.investmentPosition.update({
      where: { id },
      data,
    });
  }

  async deletePosition(userId: string, id: string) {
    const existing = await this.prisma.investmentPosition.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Posición no encontrada');
    return this.prisma.investmentPosition.delete({ where: { id } });
  }

  async getEvents(userId: string, positionId: string) {
    const pos = await this.prisma.investmentPosition.findFirst({
      where: { id: positionId, userId },
    });
    if (!pos) throw new NotFoundException('Posición no encontrada');
    return this.prisma.investmentEvent.findMany({
      where: { investmentId: positionId },
      orderBy: { date: 'desc' },
    });
  }

  async createEvent(userId: string, positionId: string, payload: Record<string, unknown>) {
    const pos = await this.prisma.investmentPosition.findFirst({
      where: { id: positionId, userId },
    });
    if (!pos) throw new NotFoundException('Posición no encontrada');
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.investmentEvent.create({
        data: {
          ...payload,
          investmentId: positionId,
          date: payload.date
            ? new Date(payload.date as string)
            : new Date(),
        } as any,
      });

      const position = await tx.investmentPosition.findUnique({
        where: { id: positionId },
      });
      if (!position) return event;

      let currentEstimatedValue = Number(position.currentEstimatedValue);
      let initialCapital = Number(position.initialCapital);
      const amount = Number(payload.amount);

      switch (payload.type) {
        case 'CAPITAL_CONTRIBUTION':
          initialCapital += amount;
          currentEstimatedValue += amount;
          break;
        case 'CAPITAL_WITHDRAWAL':
          initialCapital -= amount;
          currentEstimatedValue -= amount;
          break;
        case 'VALUATION_INCREASE':
          currentEstimatedValue += amount;
          break;
        case 'VALUATION_DECREASE':
          currentEstimatedValue -= amount;
          break;
        case 'PROFIT_REINVESTMENT':
          initialCapital += amount;
          currentEstimatedValue += amount;
          break;
        case 'PROFIT_DISTRIBUTION':
          currentEstimatedValue -= amount;
          break;
      }

      await tx.investmentPosition.update({
        where: { id: positionId },
        data: {
          currentEstimatedValue: new Prisma.Decimal(currentEstimatedValue),
          initialCapital: new Prisma.Decimal(initialCapital),
        },
      });

      return event;
    });
  }

  async getPortfolioAnalytics(userId: string): Promise<PortfolioAnalyticsResponse> {
    const [positions, debts] = await Promise.all([
      this.prisma.investmentPosition.findMany({
        where: { userId, status: 'ACTIVE' },
        include: {
          type: true,
          events: {
            orderBy: [{ date: 'asc' }, { id: 'asc' }],
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.debt.findMany({
        where: { userId, linkedPositionId: { not: null } },
        select: {
          id: true,
          name: true,
          remainingAmount: true,
          currency: true,
          debtKind: true,
          linkedPositionId: true,
        },
      }),
    ]);

    const disclaimers: string[] = [
      'Los montos se suman en nominal por posición; si tienes varias monedas, el total es orientativo.',
      'La serie histórica reconstruye el valor desde eventos registrados; ajustes manuales fuera de eventos pueden no verse reflejados.',
    ];

    let totalEstimatedValue = 0;
    let totalInitialCapital = 0;
    for (const p of positions) {
      totalEstimatedValue += Number(p.currentEstimatedValue ?? 0);
      totalInitialCapital += Number(p.initialCapital ?? 0);
    }

    const byType = new Map<
      string,
      { typeId: string; typeName: string; value: number; generatesCashflow: boolean }
    >();
    for (const p of positions) {
      const tid = p.typeId;
      const name = p.type?.name ?? 'Sin tipo';
      const gen = Boolean(p.type?.generatesCashflow);
      const v = Number(p.currentEstimatedValue ?? 0);
      const cur = byType.get(tid);
      if (cur) cur.value += v;
      else byType.set(tid, { typeId: tid, typeName: name, value: v, generatesCashflow: gen });
    }

    const compositionByType = [...byType.values()].map((row) => ({
      ...row,
      sharePct:
        totalEstimatedValue > 0 ? (row.value / totalEstimatedValue) * 100 : 0,
    }));

    let profitWithdrawn = 0;
    let profitReinvested = 0;
    let capitalContributions = 0;
    let capitalWithdrawals = 0;

    const profitWEvents: { date: Date; amount: number }[] = [];
    const profitREvents: { date: Date; amount: number }[] = [];
    const contribEvents: { date: Date; amount: number }[] = [];
    const withdrawalEvents: { date: Date; amount: number }[] = [];

    for (const p of positions) {
      for (const e of p.events) {
        const amt = Number(e.amount ?? 0);
        switch (e.type) {
          case 'PROFIT_DISTRIBUTION':
            profitWithdrawn += amt;
            profitWEvents.push({ date: e.date, amount: amt });
            break;
          case 'PROFIT_REINVESTMENT':
            profitReinvested += amt;
            profitREvents.push({ date: e.date, amount: amt });
            break;
          case 'CAPITAL_CONTRIBUTION':
          case 'INITIAL_PURCHASE':
            capitalContributions += amt;
            contribEvents.push({ date: e.date, amount: amt });
            break;
          case 'CAPITAL_WITHDRAWAL':
            capitalWithdrawals += amt;
            withdrawalEvents.push({ date: e.date, amount: amt });
            break;
          case 'PARTIAL_SALE':
          case 'TOTAL_SALE':
            capitalWithdrawals += amt;
            withdrawalEvents.push({ date: e.date, amount: amt });
            break;
          default:
            break;
        }
      }
    }

    const monthsBack = 24;
    const bw = bucketEventsByMonth(profitWEvents, monthsBack);
    const br = bucketEventsByMonth(profitREvents, monthsBack);
    const bc = bucketEventsByMonth(contribEvents, monthsBack);
    const bwd = bucketEventsByMonth(withdrawalEvents, monthsBack);
    const months = unionMonthKeys(bw, br, bc, bwd);

    const monthly = {
      months,
      profitWithdrawn: months.map((m) => bw.get(m) ?? 0),
      profitReinvested: months.map((m) => br.get(m) ?? 0),
      contributions: months.map((m) => bc.get(m) ?? 0),
      capitalWithdrawals: months.map((m) => bwd.get(m) ?? 0),
    };

    const forHistory: PositionForHistory[] = positions.map((p) => ({
      id: p.id,
      startDate: p.startDate,
      currentEstimatedValue: p.currentEstimatedValue,
      events: p.events.map((e) => ({
        id: e.id,
        date: e.date,
        type: e.type,
        amount: e.amount,
      })),
    }));

    const valueHistory = mergePortfolioValueSeries(forHistory);

    const posById = new Map(positions.map((p) => [p.id, p]));
    const linkedDebts = debts
      .filter((d) => d.linkedPositionId)
      .map((d) => {
        const pos = posById.get(d.linkedPositionId!);
        const positionEstimatedValue = pos
          ? Number(pos.currentEstimatedValue ?? 0)
          : 0;
        const remainingAmount = Number(d.remainingAmount ?? 0);
        const debtToValueRatio =
          positionEstimatedValue > 0
            ? remainingAmount / positionEstimatedValue
            : null;
        return {
          debtId: d.id,
          debtName: d.name,
          positionId: d.linkedPositionId!,
          positionName: pos?.name ?? 'Posición',
          positionEstimatedValue,
          remainingAmount,
          currency: d.currency,
          debtKind: d.debtKind,
          debtToValueRatio,
        };
      });

    const unrealizedGain = totalEstimatedValue - totalInitialCapital;
    const returnPct =
      totalInitialCapital > 0
        ? (unrealizedGain / totalInitialCapital) * 100
        : null;

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        positionCount: positions.length,
        totalEstimatedValue,
        totalInitialCapital,
        unrealizedGain,
        returnPct,
      },
      compositionByType,
      profitFlow: {
        lifetimeWithdrawn: profitWithdrawn,
        lifetimeReinvested: profitReinvested,
        netTakenOut: profitWithdrawn - profitReinvested,
      },
      capitalFlow: {
        lifetimeContributions: capitalContributions,
        lifetimeWithdrawals: capitalWithdrawals,
        netContributed: capitalContributions - capitalWithdrawals,
      },
      monthly,
      valueHistory,
      linkedDebts,
      disclaimers,
    };
  }
}
