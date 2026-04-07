import type {
  FinancialConfidence,
  FinancialExplanation,
} from '@personal-finance-os/explanation';

/** Datos de la última simulación: entrada en moneda del usuario vs USD libro del API. */
export interface AllocatorEntryMeta {
  inputCurrency: 'USD' | 'COP';
  inputAmount: number;
  bookUsdAmount: number;
  valuationAsOfDate: string;
}

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

export interface CapitalBlendMenu {
  id: string;
  title: string;
  description: string;
  scenarios: AllocatorScenario[];
}

export interface AllocatorPlan {
  userId?: string;
  availableCapital: number;
  unallocatedCapital: number;
  scenarios: AllocatorScenario[];
  /** Escenarios informativos: otras formas de usar el mismo sobrante (no suman al “usado” encima). */
  surplusAlternatives?: AllocatorScenario[];
  /** Repartos de referencia del 100% del capital (liquidez / inv / metas). */
  capitalBlendMenus?: CapitalBlendMenu[];
  explanation: FinancialExplanation;
  confidence: FinancialConfidence;
  engineNotes?: string[];
}
