import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class CashflowService {
  constructor(private readonly prisma: PrismaService) {}

  getCategories(userId?: string) {
    return this.prisma.category.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  createCategory(payload: Record<string, unknown>) {
    return this.prisma.category.create({
      data: payload as any,
    });
  }

  getStreams(userId?: string) {
    return this.prisma.cashflowStream.findMany({
      where: userId ? { userId } : undefined,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  createStream(payload: Record<string, unknown>) {
    return this.prisma.cashflowStream.create({
      data: {
        ...payload,
        startDate: payload.startDate
          ? new Date(payload.startDate as string)
          : new Date(),
        endDate: payload.endDate
          ? new Date(payload.endDate as string)
          : undefined,
      } as any,
    });
  }

  async updateStream(userId: string, id: string, payload: Record<string, unknown>) {
    const existing = await this.prisma.cashflowStream.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Stream no encontrado');
    const data: any = { ...payload };
    if (payload.startDate) data.startDate = new Date(payload.startDate as string);
    if (payload.endDate !== undefined) {
      data.endDate = payload.endDate
        ? new Date(payload.endDate as string)
        : null;
    }
    return this.prisma.cashflowStream.update({
      where: { id },
      data,
    });
  }

  async deleteStream(userId: string, id: string) {
    const existing = await this.prisma.cashflowStream.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Stream no encontrado');
    return this.prisma.cashflowStream.delete({ where: { id } });
  }

  async getEvents(userId: string, streamId: string) {
    const stream = await this.prisma.cashflowStream.findFirst({
      where: { id: streamId, userId },
    });
    if (!stream) throw new NotFoundException('Stream no encontrado');
    return this.prisma.cashflowEvent.findMany({
      where: { streamId },
      orderBy: { date: 'desc' },
    });
  }

  async createEvent(userId: string, streamId: string, payload: Record<string, unknown>) {
    const stream = await this.prisma.cashflowStream.findFirst({
      where: { id: streamId, userId },
    });
    if (!stream) throw new NotFoundException('Stream no encontrado');
    return this.prisma.cashflowEvent.create({
      data: {
        ...payload,
        streamId,
        date: payload.date
          ? new Date(payload.date as string)
          : new Date(),
      } as any,
    });
  }
}
