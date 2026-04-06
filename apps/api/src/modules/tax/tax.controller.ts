import {
  Controller,
  Get,
  Post,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DbUserId } from '../../auth/db-user.decorator';
import { TaxDeclarationPreviewDto } from './dto/tax-declaration-preview.dto';
import { TaxService } from './tax.service';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('planning-overview')
  getPlanningOverview(@DbUserId() userId: string) {
    return this.taxService.getPlanningOverview(userId);
  }

  @Get('profile')
  getProfile(@DbUserId() userId: string) {
    return this.taxService.getProfile(userId);
  }

  @Post('profile')
  saveProfile(@DbUserId() userId: string, @Body() body: Record<string, unknown>) {
    const analyzeFlag =
      body.analyze === true ||
      body.analyzeAfterSave === true ||
      body.runAnalyze === true;
    const clean = { ...body };
    delete clean.analyze;
    delete clean.analyzeAfterSave;
    delete clean.runAnalyze;
    delete clean.userId;

    if (analyzeFlag) {
      return this.taxService.saveProfileAndAnalyze(userId, clean);
    }
    return this.taxService.saveProfile({ ...clean, userId });
  }

  @Get('classifications')
  getClassifications(@DbUserId() userId: string) {
    return this.taxService.getClassifications(userId);
  }

  @Get('plan')
  getPlan(@DbUserId() userId: string) {
    return this.taxService.getLatestPlan(userId);
  }

  @Get('declaration-insights')
  getDeclarationInsights(@DbUserId() userId: string) {
    return this.taxService.getDeclarationInsights(userId);
  }

  @Post('declaration-preview')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async previewDeclaration(
    @DbUserId() userId: string,
    @Body() body: TaxDeclarationPreviewDto,
  ) {
    const ids = body.leverIds;
    const result = await this.taxService.previewLeverCombination(userId, ids);
    if (!result) {
      throw new NotFoundException('No hay perfil fiscal guardado');
    }
    return result;
  }

  @Post('analyze')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  analyzeTaxSituation(@DbUserId() userId: string) {
    return this.taxService.analyzeTaxSituation(userId);
  }
}
