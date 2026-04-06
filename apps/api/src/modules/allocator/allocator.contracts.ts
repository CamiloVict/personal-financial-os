import type {
  FinancialConfidence,
  FinancialExplanation,
} from '@personal-finance-os/explanation';

export interface AllocatorInput {
  /** Ignored by the API; usuario viene del token. Opcional por compatibilidad con clientes antiguos. */
  userId?: string;
  availableCapital: number;
}

/** Escenario hipotético de asignación de capital (no es asesoría ni instrucción de actuar). */
export interface AllocationScenario {
  id: string;
  type:
    | 'IMPACT_TAX_SHELTER'
    | 'IMPACT_DEBT_PAYDOWN'
    | 'IMPACT_GOAL_FUNDING'
    | 'INVESTMENT_OPPORTUNITY';
  title: string;
  description: string;
  /** Monto usado en el modelo para este escenario. */
  modeledAmount: number;
  expectedReturnAmount: number;
  returnPercentage: number;
  priorityScore: number;
  actionData?: any;
}

export interface AllocatorResult {
  userId: string;
  availableCapital: number;
  /** Notas del motor (liquidez vs prioridad fiscal, etc.). */
  engineNotes?: string[];
  unallocatedCapital: number;
  scenarios: AllocationScenario[];
  explanation: FinancialExplanation;
  confidence: FinancialConfidence;
}
