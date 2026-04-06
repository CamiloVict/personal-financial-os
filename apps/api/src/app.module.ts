import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClerkAuthGuard } from './auth/clerk-auth.guard';

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
import { ConfidenceModule } from './modules/confidence/confidence.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
    }),
    AuthModule,
    PrismaModule,
    ConfidenceModule,
    CurrencyModule,
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
  providers: [
    AppService,
    RequestContextMiddleware,
    { provide: APP_GUARD, useClass: ClerkAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
