export type {
  FiscalAssetTreatment,
  InvestmentTaxTreatmentLine,
  NormalizedTaxFinancials,
  TaxCreditLine,
  TaxLiabilityLine,
  TaxMonetaryLine,
  TaxMonetaryLineKind,
} from '../core/tax-normalization';

import type { TaxClassificationResult } from '../core/contracts';
import type {
  InvestmentTaxTreatmentLine,
  TaxCreditLine,
  TaxLiabilityLine,
  TaxMonetaryLine,
} from '../core/tax-normalization';

/** Paquete completo para trazabilidad API ↔ motor. */
export interface TaxEngineFinancialPackage {
  income: {
    totalGrossAnnual: number;
    classifications: TaxClassificationResult[];
    foreignTaxCreditAnnual: number;
  };
  deductions: TaxMonetaryLine[];
  credits: TaxCreditLine[];
  liabilities: TaxLiabilityLine[];
  investments: InvestmentTaxTreatmentLine[];
}
