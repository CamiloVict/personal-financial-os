import { Module } from '@nestjs/common';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';
import { DebtsAmortizationService } from './debts-amortization.service';
import { DebtsCronService } from './debts-cron.service';

@Module({
  controllers: [DebtsController],
  providers: [DebtsService, DebtsAmortizationService, DebtsCronService],
})
export class DebtsModule {}