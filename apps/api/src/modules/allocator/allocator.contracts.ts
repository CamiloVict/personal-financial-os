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

/** Menú alternativo: reparte el 100% del capital de entrada (USD libro) sin el orden fiscal→deuda→déficit. */
export interface CapitalBlendMenu {
  id: string;
  title: string;
  description: string;
  scenarios: AllocationScenario[];
}

export interface AllocatorResult {
  userId: string;
  availableCapital: number;
  /** Notas del motor (liquidez vs prioridad fiscal, etc.). */
  engineNotes?: string[];
  unallocatedCapital: number;
  scenarios: AllocationScenario[];
  /**
   * Ideas con el mismo monto de sobrante (una u otra, no acumulativas con las tarjetas de arriba).
   * Solo aparece cuando hubo capital sin asignar tras fiscal/deuda/metas mínimas.
   */
  surplusAlternatives?: AllocationScenario[];
  /**
   * Vistas de referencia que reparten todo el capital entre liquidez, inversión ilustrativa y metas
   * (pesos del déficit en USD libro). Mutuamente excluyentes entre sí y con la columna principal.
   */
  capitalBlendMenus?: CapitalBlendMenu[];
  explanation: FinancialExplanation;
  confidence: FinancialConfidence;
}
