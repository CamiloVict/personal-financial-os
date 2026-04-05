import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  ColombiaTaxEngineAG2026,
  TaxProfileInput,
  IncomeStreamInput,
} from '@personal-finance-os/tax-engine';

@Injectable()
export class TaxService {
  private readonly engine = new ColombiaTaxEngineAG2026();

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.taxProfile.findFirst({
      where: { userId },
      orderBy: [{ taxYear: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async saveProfile(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    const taxYear = (payload.taxYear as number) ?? new Date().getFullYear();
    const jurisdiction = (payload.jurisdiction as string) || 'CO';

    return this.prisma.taxProfile.upsert({
      where: {
        userId_taxYear_jurisdiction: { userId, taxYear, jurisdiction },
      },
      create: {
        userId,
        taxYear,
        jurisdiction,
        isResident: (payload.isResident as boolean) ?? true,
        daysInCountry: (payload.daysInCountry as number) ?? 365,
        primaryNationality: (payload.primaryNationality as string) || 'CO',
        hasForeignIncome: (payload.hasForeignIncome as boolean) ?? false,
        hasForeignAssets: (payload.hasForeignAssets as boolean) ?? false,
        hasDependents: (payload.hasDependents as boolean) ?? false,
        hasVoluntaryPension:
          (payload.hasVoluntaryPension as boolean) ?? false,
        hasAFC: (payload.hasAFC as boolean) ?? false,
        hasPrepaidMedicine: (payload.hasPrepaidMedicine as boolean) ?? false,
        hasHousingInterest:
          (payload.hasHousingInterest as boolean) ?? false,
      },
      update: {
        isResident: payload.isResident as boolean,
        daysInCountry: payload.daysInCountry as number,
        hasDependents: payload.hasDependents as boolean,
        hasVoluntaryPension: payload.hasVoluntaryPension as boolean,
        hasAFC: payload.hasAFC as boolean,
        hasPrepaidMedicine: payload.hasPrepaidMedicine as boolean,
        hasHousingInterest: payload.hasHousingInterest as boolean,
      },
    });
  }

  async analyzeTaxSituation(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Tax Profile is required to run the engine.');
    }

    const profileInput: TaxProfileInput = {
      isResident: profile.isResident,
      daysInCountry: profile.daysInCountry,
      primaryNationality: profile.primaryNationality,
      hasForeignIncome: profile.hasForeignIncome,
      hasDependents: profile.hasDependents,
      hasVoluntaryPension: profile.hasVoluntaryPension,
      hasAFC: profile.hasAFC,
      hasPrepaidMedicine: profile.hasPrepaidMedicine,
      hasHousingInterest: profile.hasHousingInterest,
    };

    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId, flowType: 'INCOME' },
    });

    const incomeStreams: IncomeStreamInput[] = streams.map((s) => ({
      id: s.id,
      amount: Number(s.expectedAmount) * 12,
      sourceCountry:
        s.currency === 'USD' || s.currency === 'EUR' ? 'FOREIGN' : 'CO',
      currency: s.currency,
      type: s.streamType as 'FIXED' | 'VARIABLE',
      contractType: s.currency === 'USD' ? 'FOREIGN_CONTRACTOR' : 'LABOR',
      hasSubordination: s.currency !== 'USD',
    }));

    const classifications = incomeStreams.map((stream) =>
      this.engine.classifyIncome(stream, profileInput),
    );

    for (const c of classifications) {
      const existing = await this.prisma.taxIncomeClassification.findFirst({
        where: { profileId: profile.id, referenceId: c.referenceId },
      });
      const data = {
        suggestedCedula: c.suggestedCedula,
        confidenceLevel: c.confidenceLevel,
        isForeignSource: c.isForeignSource,
        hasWithholding: false,
        foreignTaxPaid: c.foreignTaxPaid,
        engineVersion: this.engine.version,
        explanation: c.explanation,
        missingConditions: c.missingConditions,
      };
      if (existing) {
        await this.prisma.taxIncomeClassification.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await this.prisma.taxIncomeClassification.create({
          data: {
            profileId: profile.id,
            referenceId: c.referenceId,
            referenceType: 'CASHFLOW',
            ...data,
          },
        });
      }
    }

    const scenarios = this.engine.generateScenarios(
      profileInput,
      classifications,
    );

    const plan = await this.prisma.taxPlan.create({
      data: { profileId: profile.id },
    });

    for (const sc of scenarios) {
      await this.prisma.taxScenario.create({
        data: {
          planId: plan.id,
          name: sc.name,
          type: sc.type,
          estimatedGrossIncome: sc.estimatedGrossIncome,
          estimatedDeductions: sc.estimatedDeductions,
          estimatedExemptions: sc.estimatedExemptions,
          estimatedTaxableBase: sc.estimatedTaxableBase,
          estimatedTaxLiability: sc.estimatedTaxLiability,
          estimatedForeignCredit: sc.estimatedForeignCredit,
          estimatedNetTaxPayable: sc.estimatedNetTaxPayable,
          explanation: sc.explanation,
          riskLevel: sc.riskLevel,
          requirements: sc.requirements,
        },
      });
    }

    return {
      profile,
      classifications,
      scenarios,
    };
  }

  async getClassifications(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) return [];

    const classifications =
      await this.prisma.taxIncomeClassification.findMany({
        where: { profileId: profile.id },
      });

    const ids = classifications.map((c) => c.referenceId);
    const streams =
      ids.length === 0
        ? []
        : await this.prisma.cashflowStream.findMany({
            where: { id: { in: ids } },
          });

    return classifications.map((c) => ({
      ...c,
      stream: streams.find((s) => s.id === c.referenceId) ?? null,
    }));
  }

  async getLatestPlan(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) return null;

    const latestPlan = await this.prisma.taxPlan.findFirst({
      where: { profileId: profile.id },
      orderBy: { generatedAt: 'desc' },
      include: { scenarios: true },
    });

    if (!latestPlan) return null;
    return { ...latestPlan, scenarios: latestPlan.scenarios };
  }
}
