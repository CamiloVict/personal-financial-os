import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DebtsAmortizationService } from './debts-amortization.service';

@Injectable()
export class DebtsCronService {
  private readonly log = new Logger(DebtsCronService.name);

  constructor(private readonly amortization: DebtsAmortizationService) {}

  /** Diario UTC ~ mediodía; solo efecto si aún no se aplicó cuota en ese mes. */
  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  handleDebtAutoPayments(): void {
    this.amortization.applyScheduledPayments().catch((err) => {
      this.log.error(err?.message ?? err);
    });
  }
}
