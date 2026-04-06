import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { splitMonthlyInstallment } from './debt-monthly-split.util';

@Injectable()
export class DebtsAmortizationService {
  private readonly log = new Logger(DebtsAmortizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Mes calendario UTC `YYYY-MM` (idempotencia de cuota automática). */
  currentUtcYearMonth(): string {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  /**
   * Aplica `monthlyPayment` a `remainingAmount` una vez por deuda y por mes UTC
   * cuando `autoApplyMonthlyPayment` está activo.
   */
  async applyScheduledPayments(): Promise<{ updated: number; yearMonth: string }> {
    const ym = this.currentUtcYearMonth();
    const debts = await this.prisma.debt.findMany({
      where: {
        autoApplyMonthlyPayment: true,
        monthlyPayment: { gt: 0 },
        remainingAmount: { gt: 0 },
        OR: [{ lastAutoPaymentMonth: null }, { lastAutoPaymentMonth: { not: ym } }],
      },
    });

    let updated = 0;
    for (const d of debts) {
      const pay = Number(d.monthlyPayment);
      const rem = Number(d.remainingAmount);
      if (!Number.isFinite(pay) || pay <= 0 || rem <= 0) continue;
      const ratePct = Number(d.interestRate ?? 0);
      const { interestPortion, principalPortion, newRemaining } =
        splitMonthlyInstallment(rem, pay, ratePct);
      await this.prisma.debt.update({
        where: { id: d.id },
        data: {
          remainingAmount: new Prisma.Decimal(newRemaining),
          lastAutoPaymentMonth: ym,
          lastAutoInterestPortion: new Prisma.Decimal(interestPortion),
          lastAutoPrincipalPortion: new Prisma.Decimal(principalPortion),
        },
      });
      updated++;
    }

    if (updated > 0) {
      this.log.log(`Amortización automática: ${updated} deuda(s) actualizadas (${ym})`);
    }
    return { updated, yearMonth: ym };
  }
}
