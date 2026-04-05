import { Controller, Get, Post, Body } from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
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
}
