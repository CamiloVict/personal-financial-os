/** Contratos de normalización fiscal (sin depender de grafo de explicación). */

export interface TaxMonetaryLine {
  id: string;
  source: 'CASHFLOW_EXPENSE' | 'DEBT' | 'INVESTMENT' | 'INFERRED_KEYWORD';
  kind: TaxMonetaryLineKind;
  annualAmountCOP: number;
  label: string;
  referenceId?: string;
}

export type TaxMonetaryLineKind =
  | 'PREPAID_MEDICINE'
  | 'HOUSING_INTEREST'
  | 'VOLUNTARY_PENSION_CONTRIBUTION'
  | 'AFC_CONTRIBUTION'
  | 'OTHER_DEDUCTIBLE';

export interface TaxLiabilityLine {
  id: string;
  debtId?: string;
  kind: 'MORTGAGE' | 'OTHER_INSTALLMENT';
  estimatedAnnualInterestCOP: number;
  label: string;
}

export interface TaxCreditLine {
  id: string;
  source: string;
  annualAmountCOP: number;
  label: string;
  referenceId?: string;
}

export type FiscalAssetTreatment =
  | 'NONE'
  | 'RENTA_EXENTA_STYLE_AFC'
  | 'RENTA_EXENTA_STYLE_PENSION'
  | 'FINANCIAL_INCOME_ORDINARY'
  | 'REAL_ESTATE_RENTAL'
  | 'CAPITAL_GAINS_STYLE';

export interface InvestmentTaxTreatmentLine {
  positionId: string;
  /** Nombre de la posición en el producto (ej. cuenta AFC). Opcional en snapshots antiguos. */
  name?: string;
  typeId: string;
  typeName: string;
  treatment: FiscalAssetTreatment;
  notes: string;
}

export interface NormalizedTaxFinancials {
  deductions: TaxMonetaryLine[];
  credits: TaxCreditLine[];
  liabilities: TaxLiabilityLine[];
  investments: InvestmentTaxTreatmentLine[];
  warnings: string[];
}
