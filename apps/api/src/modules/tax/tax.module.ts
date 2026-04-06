import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';

@Module({
  imports: [CurrencyModule],
  controllers: [TaxController],
  providers: [TaxService],
})
export class TaxModule {}