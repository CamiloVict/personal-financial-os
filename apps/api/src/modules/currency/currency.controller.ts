import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { ConversionService, DISPLAY_VALUATION_MODES } from './conversion.service';
import { UserPreferencesService } from './user-preferences.service';

@Controller()
export class CurrencyController {
  constructor(
    private readonly conversion: ConversionService,
    private readonly preferences: UserPreferencesService,
  ) {}

  @Get('preferences')
  getPreferences(@DbUserId() userId: string) {
    return this.preferences.getOrCreate(userId);
  }

  @Patch('preferences')
  patchPreferences(
    @DbUserId() userId: string,
    @Body()
    body: {
      baseCurrency?: string;
      displayValuationMode?: string;
      realTermsBaseMonth?: string | null;
      valuationAsOfDate?: string | null;
    },
  ) {
    return this.preferences.patch(userId, body);
  }

  @Post('currency/convert')
  convert(
    @Body()
    body: {
      amount: number;
      from: string;
      to: string;
      date: string;
    },
  ) {
    const date = new Date(body.date);
    return this.conversion.convert(body.amount, body.from, body.to, date);
  }

  @Post('currency/present-lines')
  @HttpCode(HttpStatus.OK)
  presentLines(
    @Body()
    body: {
      display: string;
      asOfDate: string;
      realTermsBaseMonth?: string;
      lines: Array<{
        id: string;
        amount: number;
        currency: string;
        valueDate: string;
      }>;
    },
  ) {
    const display = body.display as (typeof DISPLAY_VALUATION_MODES)[number];
    return this.conversion.presentLines({
      display,
      asOfDate: new Date(body.asOfDate),
      realTermsBaseMonth: body.realTermsBaseMonth
        ? new Date(body.realTermsBaseMonth)
        : undefined,
      lines: (body.lines ?? []).map((l) => ({
        id: l.id,
        amount: l.amount,
        currency: l.currency,
        valueDate: new Date(l.valueDate),
      })),
    });
  }

  @Get('currency/fx/last')
  lastFx(@Query('quote') quote: string) {
    return this.conversion.lastFx(quote);
  }

  @Get('currency/fx')
  listFx(
    @Query('quote') quote: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.conversion.listFxRates(quote, from, to);
  }

  @Post('currency/fx')
  upsertFx(
    @Body()
    body: {
      asOfDate: string;
      quoteCurrency: string;
      copPerUnit: number;
      source?: string;
    },
  ) {
    return this.conversion.upsertFxRate(body);
  }

  @Get('currency/inflation-series')
  inflationSeries() {
    return this.conversion.listInflationSeries();
  }
}
