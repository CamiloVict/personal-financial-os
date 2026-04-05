import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Modules
import { PrismaModule } from './infrastructure/database/prisma.module';
import { CashflowModule } from './modules/cashflow/cashflow.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { GoalsModule } from './modules/goals/goals.module';
import { TaxModule } from './modules/tax/tax.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AllocatorModule } from './modules/allocator/allocator.module';
import { SimulatorModule } from './modules/simulator/simulator.module';
import { DebtsModule } from './modules/debts/debts.module';

@Module({
  imports: [
    PrismaModule,
    CashflowModule,
    InvestmentsModule,
    GoalsModule,
    TaxModule,
    AnalyticsModule,
    AllocatorModule,
    SimulatorModule,
    DebtsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
