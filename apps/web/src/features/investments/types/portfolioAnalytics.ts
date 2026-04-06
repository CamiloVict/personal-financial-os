export type PortfolioAnalyticsResponse = {
  generatedAt: string;
  totals: {
    positionCount: number;
    totalEstimatedValue: number;
    totalInitialCapital: number;
    unrealizedGain: number;
    returnPct: number | null;
  };
  compositionByType: Array<{
    typeId: string;
    typeName: string;
    value: number;
    sharePct: number;
    generatesCashflow: boolean;
  }>;
  profitFlow: {
    lifetimeWithdrawn: number;
    lifetimeReinvested: number;
    netTakenOut: number;
  };
  capitalFlow: {
    lifetimeContributions: number;
    lifetimeWithdrawals: number;
    netContributed: number;
  };
  monthly: {
    months: string[];
    profitWithdrawn: number[];
    profitReinvested: number[];
    contributions: number[];
    capitalWithdrawals: number[];
  };
  valueHistory: Array<{ date: string; value: number }>;
  linkedDebts: Array<{
    debtId: string;
    debtName: string;
    positionId: string;
    positionName: string;
    positionEstimatedValue: number;
    remainingAmount: number;
    currency: string;
    debtKind: string | null;
    debtToValueRatio: number | null;
  }>;
  disclaimers: string[];
};
