import type {
  FinancialConfidence,
  FinancialExplanation,
} from '@personal-finance-os/explanation';

// Base Result Interfaces
export interface SimulationYearData {
  year: number;
  baselineNetWorth: number; // General baseline (Option A)
  scenarioNetWorth: number; // General scenario (Option B)
  // Additional dynamic fields can be passed for graphing
  [key: string]: any;
}

export interface SimulationResult {
  userId: string;
  // Textual Insights
  primaryInsight: string;
  secondaryInsight: string;
  tertiaryInsight: string;
  // Projections
  years: SimulationYearData[];
  // Summary after N years
  finalScenarioNetWorth: number;
  finalBaselineNetWorth: number;
  roiDifference: number; // percentage difference
  // Additional metric details
  metrics: { label: string; value: string; color: string }[];
  /** Cómo se construyó la simulación (reglas, supuestos, entradas). */
  explanation: FinancialExplanation;
  confidence: FinancialConfidence;
}

// 1. Property Purchase (Existing)
export interface SimulatePropertyPurchaseInput {
  propertyValue: number;
  downPayment: number;
  interestRateAnnual: number;
  loanTermYears: number;
  expectedMonthlyRent: number;
  expectedAnnualAppreciation: number;
  maintenanceAnnualPercentage: number;
  baselineInvestmentReturn: number;
}

// 2. Pay Debt vs Invest
export interface SimulateDebtVsInvestInput {
  debtBalance: number;
  debtInterestRateAnnual: number;
  minimumMonthlyPayment: number;
  monthlyExtraCapital: number; // Money available to EITHER overpay debt OR invest
  investmentReturnAnnual: number;
  yearsToSimulate: number;
}

// 3. Tax Advantaged Account (AFC/FPV vs Traditional)
export interface SimulateTaxAdvantagedInput {
  monthlyContribution: number;
  marginalTaxRate: number; // e.g. 35 for 35%
  investmentReturnAnnual: number;
  yearsToSimulate: number;
}

// 4. Business/Side-Hustle vs Passive Market
export interface SimulateBusinessInput {
  initialCapital: number;
  monthlyOperatingCost: number;
  expectedMonthlyRevenue: number;
  passiveMarketReturnAnnual: number; // e.g. 8%
  yearsToSimulate: number;
}

// 5. Custom / Other
export interface SimulateCustomInput {
  // Baseline
  baselineInitialCapital: number;
  baselineMonthlyContribution: number;
  baselineAnnualReturn: number; // e.g. 8%
  // Scenario
  scenarioInitialCapital: number;
  scenarioMonthlyContribution: number;
  scenarioAnnualReturn: number; // e.g. 10%
  scenarioAnnualCost: number; // e.g. 2%
  // Generic
  yearsToSimulate: number;
}