import { Controller, Get, Post, Body } from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { TaxService } from './tax.service';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('profile')
  getProfile(@DbUserId() userId: string) {
    return this.taxService.getProfile(userId);
  }

  @Post('profile')
  saveProfile(@DbUserId() userId: string, @Body() body: Record<string, unknown>) {
    return this.taxService.saveProfile({ ...body, userId });
  }

  @Get('classifications')
  getClassifications(@DbUserId() userId: string) {
    return this.taxService.getClassifications(userId);
  }

  @Get('plan')
  getPlan(@DbUserId() userId: string) {
    return this.taxService.getLatestPlan(userId);
  }

  @Post('analyze')
  analyzeTaxSituation(@DbUserId() userId: string) {
    return this.taxService.analyzeTaxSituation(userId);
  }
}
