import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
  async previewDeclaration(
    @DbUserId() userId: string,
    @Body() body: { leverIds?: string[] },
  ) {
    const ids = body?.leverIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('leverIds debe ser un array no vacío');
    }
    const result = await this.taxService.previewLeverCombination(userId, ids);
    if (!result) {
      throw new NotFoundException('No hay perfil fiscal guardado');
    }
    return result;
  }

  @Post('analyze')
  analyzeTaxSituation(@DbUserId() userId: string) {
    return this.taxService.analyzeTaxSituation(userId);
  }
}
