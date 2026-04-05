import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { LeverageAnalysisResult, DebtItem } from './debts.contracts';

@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get('leverage-analysis/:userId')
  async getLeverageAnalysis(@Param('userId') userId: string): Promise<LeverageAnalysisResult> {
    return this.debtsService.getLeverageAnalysis(userId);
  }

  @Get(':userId')
  async getAllDebts(@Param('userId') userId: string): Promise<DebtItem[]> {
    return this.debtsService.getAllDebts(userId);
  }

  @Post()
  async createDebt(@Body() debtData: any): Promise<any> {
    return this.debtsService.createDebt(debtData);
  }
}
