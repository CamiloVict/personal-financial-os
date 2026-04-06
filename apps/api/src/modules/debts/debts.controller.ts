import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { Public } from '../../auth/public.decorator';
import { DebtsService } from './debts.service';
import { LeverageAnalysisResult, DebtItem } from './debts.contracts';

@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get('leverage-analysis')
  async getLeverageAnalysis(@DbUserId() userId: string): Promise<LeverageAnalysisResult> {
    return this.debtsService.getLeverageAnalysis(userId);
  }

  @Get()
  async getAllDebts(@DbUserId() userId: string): Promise<DebtItem[]> {
    return this.debtsService.getAllDebts(userId);
  }

  @Post()
  async createDebt(@DbUserId() userId: string, @Body() debtData: Record<string, unknown>): Promise<unknown> {
    return this.debtsService.createDebt({ ...debtData, userId });
  }

  @Patch(':id')
  async patchDebt(
    @DbUserId() userId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ): Promise<DebtItem> {
    return this.debtsService.patchDebt(userId, id, body);
  }

  /** Cron externo (Fly Machines sleep, etc.): `CRON_SECRET` en header `x-cron-secret`. */
  @Public()
  @Post('internal/run-monthly-amortization')
  async runMonthlyAmortization(
    @Headers('x-cron-secret') secret: string | undefined,
  ) {
    const expected = process.env.CRON_SECRET;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException();
    }
    return this.debtsService.runScheduledAmortizationForOps();
  }
}
