import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DbUserId } from '../../auth/db-user.decorator';
import { ConversionService } from './conversion.service';
import {
  ConvertCurrencyDto,
  FxUpsertDto,
  PresentLinesDto,
} from './dto/currency-present.dto';
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
  convert(@Body() body: ConvertCurrencyDto) {
    const date = new Date(body.date);
    return this.conversion.convert(body.amount, body.from, body.to, date);
  }

  @Post('currency/present-lines')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 45, ttl: 60_000 } })
  presentLines(@Body() body: PresentLinesDto) {
    const display = body.display as 'NOMINAL_COP' | 'NOMINAL_USD' | 'REAL_COP';
    return this.conversion.presentLines({
      display,
      asOfDate: new Date(body.asOfDate),
      realTermsBaseMonth: body.realTermsBaseMonth
        ? new Date(body.realTermsBaseMonth)
        : undefined,
      lines: body.lines.map((l) => ({
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

  /**
   * Mutación global de cotizaciones: requiere `FX_UPSERT_SECRET` y header `x-fx-upsert-secret`.
   * No basta con estar autenticado (evita que cualquier usuario altere FX compartidas).
   */
  @Post('currency/fx')
  upsertFx(
    @Headers('x-fx-upsert-secret') secret: string | undefined,
    @Body() body: FxUpsertDto,
  ) {
    const expected = process.env.FX_UPSERT_SECRET?.trim();
    if (!expected || secret !== expected) {
      throw new ForbiddenException('FX upsert not authorized');
    }
    return this.conversion.upsertFxRate(body);
  }

  @Get('currency/inflation-series')
  inflationSeries() {
    return this.conversion.listInflationSeries();
  }
}
