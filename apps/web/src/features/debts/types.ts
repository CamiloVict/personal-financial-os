import type {
  FinancialConfidence,
  FinancialExplanation,
} from '@personal-finance-os/explanation';

/** Respuesta de GET /debts/leverage-analysis (usuario autenticado) */
export interface LeverageAnalysis {
  totalDebt: number;
  badDebtTotal: number;
  goodDebtTotal: number;
  badDebts: BadDebtRow[];
  goodDebts: GoodDebtRow[];
  weightedAverageInterestRate: number;
  leverageRatio: number;
  leverageHealthStatus: string;
  explanation: FinancialExplanation;
  confidence: FinancialConfidence;
}

export interface BadDebtRow {
  id: string;
  name: string;
  remainingAmount: number;
  interestRate: number;
  currency?: string;
}

export interface GoodDebtRow extends BadDebtRow {
  isPositiveLeverage: boolean;
  taxShieldRate: number;
  effectiveCostOfDebt: number;
  cashOnCashReturn: number;
}
