import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CashflowService } from './cashflow.service';

describe('CashflowService ownership', () => {
  it('updateStream no actualiza si el stream no pertenece al usuario', async () => {
    const prisma = {
      cashflowStream: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
    };
    const svc = new CashflowService(prisma as any);
    await expect(svc.updateStream('user-a', 'stream-1', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.cashflowStream.update).not.toHaveBeenCalled();
  });

  it('deleteStream no borra si el stream no pertenece al usuario', async () => {
    const prisma = {
      cashflowStream: {
        findFirst: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      },
    };
    const svc = new CashflowService(prisma as any);
    await expect(svc.deleteStream('user-a', 'stream-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.cashflowStream.delete).not.toHaveBeenCalled();
  });
});
