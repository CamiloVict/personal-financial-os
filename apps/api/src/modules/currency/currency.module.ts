import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ConversionService } from './conversion.service';
import { CurrencyController } from './currency.controller';
import { UserPreferencesService } from './user-preferences.service';

@Module({
  imports: [PrismaModule],
  controllers: [CurrencyController],
  providers: [ConversionService, UserPreferencesService],
  exports: [ConversionService, UserPreferencesService],
})
export class CurrencyModule {}
