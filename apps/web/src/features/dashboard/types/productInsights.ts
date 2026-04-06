export type InsightKind =
  | 'EXCESS_CATEGORY_SPEND'
  | 'LOW_SAVINGS'
  | 'HIGH_FIXED_DEPENDENCY'
  | 'GOAL_BEHIND'
  | 'REINVESTMENT_OPPORTUNITY'
  | 'LIQUIDITY_ALERT'
  | 'TAX_OPPORTUNITY'
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
  module: InsightModule;
  href: string;
};

export type ProductInsightsResponse = {
  insights: ProductInsight[];
  generatedAt: string;
};
