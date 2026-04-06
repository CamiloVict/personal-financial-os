export interface TaxProfileInput {
  isResident: boolean;
  daysInCountry: number;
  primaryNationality: string;
  hasForeignIncome: boolean;
  
  // Specific benefits checks
  hasDependents: boolean;
  hasVoluntaryPension: boolean;
  hasAFC: boolean;
  hasPrepaidMedicine: boolean;
  hasHousingInterest: boolean;
}

export interface IncomeStreamInput {
  id: string;
  amount: number;
  sourceCountry: string;
  currency: string;
  type: 'FIXED' | 'VARIABLE';
  contractType?: 'LABOR' | 'SERVICE' | 'INDEPENDENT' | 'FOREIGN_CONTRACTOR';
  hasSubordination?: boolean;
  foreignTaxPaid?: number;
}

export interface TaxClassificationResult {
  referenceId: string;
  /** Ingreso anual estimado (ej. mensual × 12) asociado a esta clasificación */
  annualGrossAmount: number;
  suggestedCedula: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isForeignSource: boolean;
  foreignTaxPaid: number;
  explanation: string;
  missingConditions: string[];
}

/** Fila para comparar impuesto aproximado al activar una palanca en simulación */
export interface TaxLeverComparisonRow {
  id: string;
  label: string;
  description: string;
  estimatedGrossIncome: number;
  estimatedTaxableBase: number;
  estimatedNetTaxPayable: number;
  /** Ahorro vs escenario conservador (ingreso bruto sin deducciones) */
  savingsVsConservative: number;
}

export interface TaxScenarioOutput {
  name: string;
  type: 'CONSERVATIVE' | 'OPTIMIZED' | 'FOREIGN_CREDIT';
  
  estimatedGrossIncome: number;
  estimatedDeductions: number;
  estimatedExemptions: number;
  estimatedTaxableBase: number;
  estimatedTaxLiability: number;
  estimatedForeignCredit: number;
  estimatedNetTaxPayable: number;
  
  explanation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requirements: string[];
}

export interface TaxRuleEngine {
  version: string;
  classifyIncome(stream: IncomeStreamInput, profile: TaxProfileInput): TaxClassificationResult;
  generateScenarios(
    profile: TaxProfileInput,
    classifiedIncome: TaxClassificationResult[],
    normalized?: import('./tax-normalization').NormalizedTaxFinancials,
  ): TaxScenarioOutput[];
  /** Comparación conservador vs cada beneficio aislado vs tu perfil completo */
  compareLeverScenarios(
    actualProfile: TaxProfileInput,
    classifiedIncome: TaxClassificationResult[],
    normalized?: import('./tax-normalization').NormalizedTaxFinancials,
  ): TaxLeverComparisonRow[];
}