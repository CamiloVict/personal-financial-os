import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('cashflow/:userId')
  getCashflowAnalytics(@Param('userId') userId: string) {
    return this.analyticsService.getCashflowDistribution(userId);
  }

  @Get('net-worth/:userId')
  getNetWorthAnalytics(@Param('userId') userId: string) {
    return this.analyticsService.getNetWorthAnalytics(userId);
  }

  @Get('tax/:userId')
  getTaxAnalytics(@Param('userId') userId: string) {
    return this.analyticsService.getTaxAnalytics(userId);
  }
}