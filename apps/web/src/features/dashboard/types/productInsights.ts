export type InsightKind =
  | 'EXCESS_CATEGORY_SPEND'
  | 'LOW_SAVINGS'
  | 'HIGH_FIXED_DEPENDENCY'
  | 'GOAL_BEHIND'
  | 'GOAL_MONTHLY_GAP'
  | 'GOAL_EARLIER_OPPORTUNITY'
  | 'REINVESTMENT_OPPORTUNITY'
  | 'LIQUIDITY_ALERT'
  | 'TAX_OPPORTUNITY'
  | 'TAX_VALIDATION_REMINDER'
  | 'ASSET_CONCENTRATION'
  | 'CASHFLOW_IMPROVEMENT';

export type InsightModule =
  | 'cashflow'
  | 'goals'
  | 'investments'
  | 'tax'
  | 'debts'
  | 'global';

export type ProductInsight = {
  id: string;
  kind: InsightKind;
  priority: number;
  severity: 'info' | 'attention' | 'warning';
  title: string;
  detail: string;
  why: string;
  action?: string;
  module: InsightModule;
  href: string;
};

export type ProductInsightsResponse = {
  insights: ProductInsight[];
  generatedAt: string;
};
