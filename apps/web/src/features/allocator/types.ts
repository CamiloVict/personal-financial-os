import type {
  FinancialConfidence,
  FinancialExplanation,
} from '@personal-finance-os/explanation';

export interface AllocatorScenario {
  id: string;
  type: string;
  title: string;
  description: string;
  modeledAmount: number;
  expectedReturnAmount: number;
  returnPercentage: number;
  priorityScore: number;
}

export interface AllocatorPlan {
  userId?: string;
  availableCapital: number;
  unallocatedCapital: number;
  scenarios: AllocatorScenario[];
  explanation: FinancialExplanation;
  confidence: FinancialConfidence;
  engineNotes?: string[];
}
