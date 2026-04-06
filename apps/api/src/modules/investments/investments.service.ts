import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

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

  updateType(id: string, payload: Record<string, unknown>) {
    return this.prisma.investmentTypeDefinition.update({
      where: { id },
      data: payload as any,
    });
  }

  deleteType(id: string) {
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

  updatePosition(id: string, payload: Record<string, unknown>) {
    const data: any = { ...payload };
    if (payload.startDate) data.startDate = new Date(payload.startDate as string);
    return this.prisma.investmentPosition.update({
      where: { id },
      data,
    });
  }

  deletePosition(id: string) {
    return this.prisma.investmentPosition.delete({ where: { id } });
  }

  getEvents(positionId: string) {
    return this.prisma.investmentEvent.findMany({
      where: { investmentId: positionId },
      orderBy: { date: 'desc' },
    });
  }

  async createEvent(positionId: string, payload: Record<string, unknown>) {
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
}
