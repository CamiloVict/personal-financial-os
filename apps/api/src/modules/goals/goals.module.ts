import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [CurrencyModule],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}