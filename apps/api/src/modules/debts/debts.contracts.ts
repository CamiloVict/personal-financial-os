import type {
  FinancialConfidence,
  FinancialExplanation,
} from '@personal-finance-os/explanation';

export interface DebtItem {
  id: string;
  userId: string;
  name: string;
  type: 'MORTGAGE' | 'AUTO_LOAN' | 'CREDIT_CARD' | 'PERSONAL_LOAN' | 'BUSINESS_LOAN';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number; // e.g. 12% EA
  currency: string;
  monthlyPayment: number;
  linkedAssetId?: string | null;
  createdAt: string;
}

export interface LeverageAnalysisResult {
  userId: string;
  totalDebt: number;
  totalMonthlyPayment: number;
  
  // Categorization
  badDebtTotal: number; // High interest, no asset backing (e.g. credit cards)
  goodDebtTotal: number; // Asset-backed, tax shielded, or cashflowing (e.g. mortgage, business)
  
  // Details
  badDebts: DebtItem[];
  goodDebts: Array<DebtItem & {
    // Leverage Metrics
    assetValue: number;
    assetAppreciationRate: number;
    assetCashflowRate: number;
    taxShieldRate: number;
    effectiveCostOfDebt: number; // Original Interest - Tax Shield
    cashOnCashReturn: number; // Real ROI
    isPositiveLeverage: boolean; // Is CoC > Effective Cost?
  }>;

  // Insights
  weightedAverageInterestRate: number;
  leverageRatio: number; // Debt / Total Assets
  leverageHealthStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  explanation: FinancialExplanation;
  confidence: FinancialConfidence;
}