import { Module } from '@nestjs/common';
import { AllocatorController } from './allocator.controller';
import { AllocatorService } from './allocator.service';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [CurrencyModule],
  controllers: [AllocatorController],
  providers: [AllocatorService],
})
export class AllocatorModule {}