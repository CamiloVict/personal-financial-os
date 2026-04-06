import type { FiscalAssetTreatment } from '../core/tax-normalization';

export type FiscalExpenseHint =
  | 'PREPAID_MEDICINE'
  | 'VOLUNTARY_PENSION_CONTRIBUTION'
  | 'AFC_CONTRIBUTION'
  | 'HOUSING_FINANCING_PAYMENT'
  | 'OTHER_DEDUCTIBLE';

const RULES: Array<{ test: RegExp; hint: FiscalExpenseHint }> = [
  { test: /\bafc\b|ahorro.*fomento|cuenta\s*afc/i, hint: 'AFC_CONTRIBUTION' },
  {
    test: /\bfpv\b|pensi[oó]n\s*voluntaria|fondo\s*de\s*pensi/i,
    hint: 'VOLUNTARY_PENSION_CONTRIBUTION',
  },
  {
    test: /prepagad|p[oó]liza\s*salud|medicina\s*prep|plan\s*complementar/i,
    hint: 'PREPAID_MEDICINE',
  },
  {
    test: /hipotec|cr[eé]dito\s*vivienda|leasing\s*habitac/i,
    hint: 'HOUSING_FINANCING_PAYMENT',
  },
];

export function inferFiscalExpenseHintFromText(
  categoryName: string,
  streamName: string,
  explicitHint?: string | null,
): FiscalExpenseHint | null {
  if (explicitHint && isFiscalExpenseHint(explicitHint)) {
    return explicitHint;
  }
  const blob = `${categoryName} ${streamName}`.trim();
  if (!blob) return null;
  for (const { test, hint } of RULES) {
    if (test.test(blob)) return hint;
  }
  return null;
}

function isFiscalExpenseHint(s: string): s is FiscalExpenseHint {
  return (
    s === 'PREPAID_MEDICINE' ||
    s === 'VOLUNTARY_PENSION_CONTRIBUTION' ||
    s === 'AFC_CONTRIBUTION' ||
    s === 'HOUSING_FINANCING_PAYMENT' ||
    s === 'OTHER_DEDUCTIBLE'
  );
}

export function inferFiscalAssetTreatmentFromTypeName(typeName: string): FiscalAssetTreatment {
  const n = typeName.toLowerCase();
  if (/\bafc\b|ahorro.*fomento/i.test(n)) return 'RENTA_EXENTA_STYLE_AFC';
  if (/fpv|pensi[oó]n\s*voluntaria/i.test(n)) return 'RENTA_EXENTA_STYLE_PENSION';
  if (/inmueble|vivienda|arriendo|real\s*estate|propiedad/i.test(n)) return 'REAL_ESTATE_RENTAL';
  if (/acci[oó]n|bolsa|etf|cedear|capital/i.test(n)) return 'CAPITAL_GAINS_STYLE';
  if (/cdt|bono|renta\s*fija|fondo/i.test(n)) return 'FINANCIAL_INCOME_ORDINARY';
  return 'NONE';
}
