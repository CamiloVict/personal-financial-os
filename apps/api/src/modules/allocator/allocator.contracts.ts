import type {
  FinancialConfidence,
  FinancialExplanation,
} from '@personal-finance-os/explanation';

export interface AllocatorInput {
  /** Ignored by the API; usuario viene del token. Opcional por compatibilidad con clientes antiguos. */
  userId?: string;
  availableCapital: number;
}

export interface AllocationRecommendation {
  id: string;
  type: 'TAX_OPTIMIZATION' | 'DEBT_REDUCTION' | 'GOAL_ACCELERATION' | 'INVESTMENT_OPPORTUNITY';
  title: string;
  description: string;
  suggestedAmount: number;
  expectedReturnAmount: number; // e.g. Tax saved, interest saved, or expected profit
  returnPercentage: number; // e.g. 35% ROI
  priorityScore: number; // 1 to 100, higher is more important
  actionData?: any; // Metadata for the UI to trigger an action
}

export interface AllocatorResult {
  userId: string;
  availableCapital: number;
  unallocatedCapital: number;
  recommendations: AllocationRecommendation[];
  explanation: FinancialExplanation;
  confidence: FinancialConfidence;
}
