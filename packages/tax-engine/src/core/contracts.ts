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
  suggestedCedula: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isForeignSource: boolean;
  foreignTaxPaid: number;
  explanation: string;
  missingConditions: string[];
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
  generateScenarios(profile: TaxProfileInput, classifiedIncome: TaxClassificationResult[]): TaxScenarioOutput[];
}