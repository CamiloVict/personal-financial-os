import { Controller, Get } from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('insights')
  getProductInsights(@DbUserId() userId: string) {
    return this.analyticsService.getProductInsights(userId);
  }

  @Get('cashflow')
  getCashflowAnalytics(@DbUserId() userId: string) {
    return this.analyticsService.getCashflowDistribution(userId);
  }

  @Get('net-worth')
  getNetWorthAnalytics(@DbUserId() userId: string) {
    return this.analyticsService.getNetWorthAnalytics(userId);
  }

  @Get('tax')
  getTaxAnalytics(@DbUserId() userId: string) {
    return this.analyticsService.getTaxAnalytics(userId);
  }

  @Get('cashflow-monthly')
  getCashflowMonthlyTrend(@DbUserId() userId: string) {
    return this.analyticsService.getCashflowMonthlyTrend(userId);
  }

  @Get('cashflow-intelligence')
  getCashflowIntelligence(@DbUserId() userId: string) {
    return this.analyticsService.getCashflowIntelligence(userId);
  }
}
