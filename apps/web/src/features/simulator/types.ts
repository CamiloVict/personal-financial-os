import type { FinancialExplanation } from '@personal-finance-os/explanation';

export type ScenarioType =
  | 'PROPERTY'
  | 'DEBT_VS_INVEST'
  | 'TAX_ADVANTAGED'
  | 'BUSINESS'
  | 'CUSTOM';

export interface SimulationYearData {
  year: number;
  baselineNetWorth: number;
  scenarioNetWorth: number;
}

export type SimulationMetricColor = 'emerald' | 'rose' | 'indigo' | 'amber' | 'slate';

export interface SimulationMetric {
  label: string;
  value: string;
  color: string;
}

export interface SimulationResult {
  userId: string;
  primaryInsight: string;
  secondaryInsight: string;
  tertiaryInsight: string;
  years: SimulationYearData[];
  finalScenarioNetWorth: number;
  finalBaselineNetWorth: number;
  roiDifference: number;
  metrics: SimulationMetric[];
  explanation: FinancialExplanation;
}
