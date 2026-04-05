import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TaxService } from './tax.service';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('profile/:userId')
  getProfile(@Param('userId') userId: string) {
    return this.taxService.getProfile(userId);
  }

  @Post('profile')
  saveProfile(@Body() body: any) {
    return this.taxService.saveProfile(body);
  }

  @Get('classifications/:userId')
  getClassifications(@Param('userId') userId: string) {
    return this.taxService.getClassifications(userId);
  }

  @Get('plan/:userId')
  getPlan(@Param('userId') userId: string) {
    return this.taxService.getLatestPlan(userId);
  }

  @Post('analyze/:userId')
  analyzeTaxSituation(@Param('userId') userId: string) {
    return this.taxService.analyzeTaxSituation(userId);
  }
}