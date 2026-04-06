import { annualizePeriodicAmount } from './annualize';
import {
  inferFiscalAssetTreatmentFromTypeName,
  inferFiscalExpenseHintFromText,
} from './infer-fiscal-from-text';
import type {
  FiscalAssetTreatment,
  InvestmentTaxTreatmentLine,
  NormalizedTaxFinancials,
  TaxCreditLine,
  TaxLiabilityLine,
  TaxMonetaryLine,
  TaxMonetaryLineKind,
} from './types';

export type NormalizeTaxExpenseStreamInput = {
  id: string;
  name: string;
  expectedAmount: number;
  frequency: string;
  customFrequencyMonths?: number | null;
  categoryName: string;
  currency?: string;
  fiscalExpenseHint?: string | null;
};

export type NormalizeTaxDebtInput = {
  id: string;
  name: string;
  debtKind?: string | null;
  remainingAmount: number;
  interestRate?: number | null;
  monthlyPayment?: number | null;
  currency: string;
};

export type NormalizeTaxInvestmentInput = {
  positionId: string;
  name: string;
  typeId: string;
  typeName: string;
  fiscalAssetTreatment?: string | null;
};

/**
 * Capa de normalización: traduce cashflow (gastos), deudas e inversiones del sistema
 * a líneas deducción / pasivo / tratamiento para el motor fiscal.
 *
 * Notas:
 * - Moneda: se asume COP si no hay conversión; el caller puede escalar montos en USD antes.
 * - Interés hipotecario: estimación simplificada saldo × tasa EA (sin tabla de amortización).
 */
export function normalizeFinancialDataForTax(params: {
  expenseStreams: NormalizeTaxExpenseStreamInput[];
  debts: NormalizeTaxDebtInput[];
  investments: NormalizeTaxInvestmentInput[];
}): NormalizedTaxFinancials {
  const deductions: TaxMonetaryLine[] = [];
  const credits: TaxCreditLine[] = [];
  const liabilities: TaxLiabilityLine[] = [];
  const investments: InvestmentTaxTreatmentLine[] = [];
  const warnings: string[] = [];

  const nonCopCurrencies = new Set<string>();

  for (const s of params.expenseStreams) {
    const cur = s.currency ?? 'COP';
    if (cur !== 'COP') {
      nonCopCurrencies.add(cur);
    }
  }
  for (const d of params.debts) {
    if (d.currency && d.currency !== 'COP') {
      nonCopCurrencies.add(d.currency);
    }
  }

  if (nonCopCurrencies.size > 0) {
    warnings.push(
      `Hay montos en ${[...nonCopCurrencies].join(', ')}; el motor usa cifras tal cual (sin TRM). Convierte a COP en el API para mayor precisión.`,
    );
  }

  for (const s of params.expenseStreams) {
    const annual = annualizePeriodicAmount(
      s.expectedAmount,
      s.frequency,
      s.customFrequencyMonths,
    );
    if (annual <= 0) continue;

    const hint = inferFiscalExpenseHintFromText(
      s.categoryName,
      s.name,
      s.fiscalExpenseHint,
    );
    if (!hint || hint === 'OTHER_DEDUCTIBLE') {
      if (hint === 'OTHER_DEDUCTIBLE') {
        deductions.push({
          id: `exp-${s.id}-other`,
          source: 'CASHFLOW_EXPENSE',
          kind: 'OTHER_DEDUCTIBLE',
          annualAmountCOP: annual,
          label: `Gasto (${s.name}): clasificado como deducible genérico en modelo`,
          referenceId: s.id,
        });
      }
      continue;
    }

    const kind = expenseHintToDeductionKind(hint);
    if (!kind) continue;

    deductions.push({
      id: `exp-${s.id}`,
      source: 'CASHFLOW_EXPENSE',
      kind,
      annualAmountCOP: annual,
      label: `Gasto: ${s.name} (${s.categoryName})`,
      referenceId: s.id,
    });
  }

  for (const d of params.debts) {
    const isMortgage =
      (d.debtKind || '').toUpperCase() === 'MORTGAGE' ||
      /hipotec|vivienda|housing/i.test(d.name);

    const rate = d.interestRate != null ? Number(d.interestRate) : 0;
    const remaining = Number(d.remainingAmount);
    let interestAnnual = 0;
    if (rate > 0 && remaining > 0) {
      interestAnnual = remaining * (rate / 100);
    } else if (d.monthlyPayment != null && Number(d.monthlyPayment) > 0 && isMortgage) {
      interestAnnual = Number(d.monthlyPayment) * 12 * 0.4;
      warnings.push(
        `Deuda "${d.name}": sin tasa; interés anual estimado como 40% del servicio anual (heurística).`,
      );
    }

    if (interestAnnual > 0) {
      liabilities.push({
        id: `liab-${d.id}`,
        debtId: d.id,
        kind: isMortgage ? 'MORTGAGE' : 'OTHER_INSTALLMENT',
        estimatedAnnualInterestCOP: interestAnnual,
        label: `Interés modelado: ${d.name}`,
      });
      if (isMortgage) {
        deductions.push({
          id: `debt-int-${d.id}`,
          source: 'DEBT',
          kind: 'HOUSING_INTEREST',
          annualAmountCOP: interestAnnual,
          label: `Intereses vivienda (desde deuda): ${d.name}`,
          referenceId: d.id,
        });
      }
    }
  }

  for (const inv of params.investments) {
    const treatment: FiscalAssetTreatment =
      inv.fiscalAssetTreatment &&
      inv.fiscalAssetTreatment !== '' &&
      inv.fiscalAssetTreatment !== 'NONE'
        ? (inv.fiscalAssetTreatment as FiscalAssetTreatment)
        : inferFiscalAssetTreatmentFromTypeName(inv.typeName);

    let notes =
      'Tratamiento inferido por tipo de activo; no implica renta gravada calculada en esta versión.';
    if (treatment === 'RENTA_EXENTA_STYLE_AFC') {
      notes =
        'Si hubiera aportes elegibles a AFC acreditados en contabilidad, podrían cursar como renta exenta sujeta a topes (validar con motor y norma).';
    } else if (treatment === 'RENTA_EXENTA_STYLE_PENSION') {
      notes =
        'Aportes FPV en el mundo real son renta exenta con topes; aquí solo se etiqueta el instrumento.';
    } else if (treatment === 'REAL_ESTATE_RENTAL') {
      notes =
        'Renta de arrendamiento se modela aparte del cedula general simplificado; vincula ingresos por arriendo en Cashflow.';
    }

    investments.push({
      positionId: inv.positionId,
      name: inv.name,
      typeId: inv.typeId,
      typeName: inv.typeName,
      treatment,
      notes,
    });
  }

  const hasMortgageLiability = liabilities.some((l) => l.kind === 'MORTGAGE');
  const finalDeductions = hasMortgageLiability
    ? deductions.filter(
        (d) =>
          !(d.kind === 'HOUSING_INTEREST' && d.source === 'CASHFLOW_EXPENSE'),
      )
    : deductions;

  return {
    deductions: finalDeductions,
    credits,
    liabilities,
    investments,
    warnings,
  };
}

function expenseHintToDeductionKind(
  hint: string,
): TaxMonetaryLineKind | null {
  switch (hint) {
    case 'PREPAID_MEDICINE':
      return 'PREPAID_MEDICINE';
    case 'HOUSING_FINANCING_PAYMENT':
      return 'HOUSING_INTEREST';
    case 'VOLUNTARY_PENSION_CONTRIBUTION':
      return 'VOLUNTARY_PENSION_CONTRIBUTION';
    case 'AFC_CONTRIBUTION':
      return 'AFC_CONTRIBUTION';
    default:
      return null;
  }
}
