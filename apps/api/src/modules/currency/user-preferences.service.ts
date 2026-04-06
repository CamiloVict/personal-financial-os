import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { DisplayValuationMode } from './conversion.service';
import { DISPLAY_VALUATION_MODES } from './conversion.service';

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    const existing = await this.prisma.userPreference.findUnique({
      where: { userId },
    });
    if (existing) return existing;
    return this.prisma.userPreference.create({
      data: { userId },
    });
  }

  async patch(
    userId: string,
    body: {
      baseCurrency?: string;
      displayValuationMode?: string;
      realTermsBaseMonth?: string | null;
      valuationAsOfDate?: string | null;
    },
  ) {
    await this.getOrCreate(userId);
    const data: Record<string, unknown> = {};
    if (body.baseCurrency != null) data.baseCurrency = body.baseCurrency;
    if (body.displayValuationMode != null) {
      if (
        !DISPLAY_VALUATION_MODES.includes(
          body.displayValuationMode as DisplayValuationMode,
        )
      ) {
        throw new BadRequestException('displayValuationMode inválido');
      }
      data.displayValuationMode = body.displayValuationMode;
    }
    if (body.realTermsBaseMonth !== undefined) {
      data.realTermsBaseMonth = body.realTermsBaseMonth
        ? new Date(body.realTermsBaseMonth)
        : null;
    }
    if (body.valuationAsOfDate !== undefined) {
      data.valuationAsOfDate = body.valuationAsOfDate
        ? new Date(body.valuationAsOfDate)
        : null;
    }
    return this.prisma.userPreference.update({
      where: { userId },
      data: data as any,
    });
  }
}
