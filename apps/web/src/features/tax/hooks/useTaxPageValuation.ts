import { useCallback, useMemo } from 'react';
import type { NormalizedTaxFinancials } from '@personal-finance-os/tax-engine';
import { usePresentLinesQuery } from '@/features/currency/api/queries';
import {
  presentedCurrencyFromRows,
  rowsToMap,
  type ValuationLineInput,
} from '@/features/currency/valuationUtils';
import { formatPresentedAmount } from '@/features/currency/format';
import { useGlobalStore } from '@/shared/store/global';

type DeclarationRow = {
  id: string;
  estimatedGrossIncome?: number;
  estimatedTaxableBase?: number;
  estimatedNetTaxPayable?: number;
};

function pushCOP(
  out: ValuationLineInput[],
  id: string,
  amount: unknown,
  valueDate: string,
) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return;
  out.push({ id, amount: n, currency: 'COP', valueDate });
}

export function buildTaxValuationLines(opts: {
  valuationAsOfDate: string;
  declarationInsights: {
    totalAnnualIncomeEstimated?: number;
    leverComparison?: DeclarationRow[];
  } | null | undefined;
  combinedPreview: {
    estimatedGrossIncome?: number;
    estimatedTaxableBase?: number;
    estimatedNetTaxPayable?: number;
  } | null | undefined;
  plan: { scenarios?: unknown[] } | null | undefined;
  normalizedForTax: NormalizedTaxFinancials | null | undefined;
  classifications: Array<{ referenceId?: string; stream?: { expectedAmount?: number } }>;
}): ValuationLineInput[] {
  const vd = opts.valuationAsOfDate;
  const out: ValuationLineInput[] = [];

  const decl = opts.declarationInsights;
  if (decl) {
    pushCOP(out, 'tax-decl-total-income', decl.totalAnnualIncomeEstimated, vd);
    for (const r of decl.leverComparison ?? []) {
      pushCOP(out, `tax-decl-lever-${r.id}-gross`, r.estimatedGrossIncome, vd);
      pushCOP(out, `tax-decl-lever-${r.id}-base`, r.estimatedTaxableBase, vd);
      pushCOP(out, `tax-decl-lever-${r.id}-net`, r.estimatedNetTaxPayable, vd);
    }
  }

  const combo = opts.combinedPreview;
  if (combo) {
    pushCOP(out, 'tax-combo-gross', combo.estimatedGrossIncome, vd);
    pushCOP(out, 'tax-combo-base', combo.estimatedTaxableBase, vd);
    pushCOP(out, 'tax-combo-net', combo.estimatedNetTaxPayable, vd);
  }

  const scenarios = opts.plan?.scenarios;
  if (Array.isArray(scenarios)) {
    for (const s of scenarios as Array<Record<string, unknown>>) {
      const id = String(s.id ?? '');
      if (!id) continue;
      pushCOP(out, `tax-scen-${id}-gross`, s.estimatedGrossIncome, vd);
      pushCOP(out, `tax-scen-${id}-ded`, s.estimatedDeductions, vd);
      pushCOP(out, `tax-scen-${id}-exempt`, s.estimatedExemptions, vd);
      pushCOP(out, `tax-scen-${id}-base`, s.estimatedTaxableBase, vd);
      pushCOP(out, `tax-scen-${id}-liability`, s.estimatedTaxLiability, vd);
      pushCOP(out, `tax-scen-${id}-credit`, s.estimatedForeignCredit, vd);
      pushCOP(out, `tax-scen-${id}-net`, s.estimatedNetTaxPayable, vd);
    }
  }

  const norm = opts.normalizedForTax;
  if (norm) {
    let dedT = 0;
    let liabT = 0;
    let credT = 0;
    for (const d of norm.deductions) {
      pushCOP(out, `tax-norm-ded-${d.id}`, d.annualAmountCOP, vd);
      dedT += d.annualAmountCOP;
    }
    for (const l of norm.liabilities) {
      pushCOP(out, `tax-norm-liab-${l.id}`, l.estimatedAnnualInterestCOP, vd);
      liabT += l.estimatedAnnualInterestCOP;
    }
    for (const c of norm.credits) {
      pushCOP(out, `tax-norm-cred-${c.id}`, c.annualAmountCOP, vd);
      credT += c.annualAmountCOP;
    }
    pushCOP(out, 'tax-norm-total-ded', dedT, vd);
    pushCOP(out, 'tax-norm-total-liab', liabT, vd);
    pushCOP(out, 'tax-norm-total-cred', credT, vd);
  }

  for (const c of opts.classifications) {
    const ref = c.referenceId;
    if (!ref) continue;
    const annual = Number(c.stream?.expectedAmount ?? 0) * 12;
    pushCOP(out, `tax-pie-${ref}`, annual, vd);
  }

  return out;
}

/** Expone mapa de presentación para la pestaña Plan fiscal (COP motor → barra global). */
export function useTaxPageValuation(opts: {
  enabled: boolean;
  declarationInsights: Parameters<typeof buildTaxValuationLines>[0]['declarationInsights'];
  combinedPreview: Parameters<typeof buildTaxValuationLines>[0]['combinedPreview'];
  plan: Parameters<typeof buildTaxValuationLines>[0]['plan'];
  normalizedForTax: NormalizedTaxFinancials | null | undefined;
  classifications: Parameters<typeof buildTaxValuationLines>[0]['classifications'];
}) {
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);
  const realTermsBaseMonth = useGlobalStore((s) => s.realTermsBaseMonth);
  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);

  const lines = useMemo(
    () =>
      buildTaxValuationLines({
        valuationAsOfDate,
        declarationInsights: opts.declarationInsights,
        combinedPreview: opts.combinedPreview,
        plan: opts.plan,
        normalizedForTax: opts.normalizedForTax ?? null,
        classifications: opts.classifications,
      }),
    [
      valuationAsOfDate,
      opts.declarationInsights,
      opts.combinedPreview,
      opts.plan,
      opts.normalizedForTax,
      opts.classifications,
    ],
  );

  const { data: rows, isLoading } = usePresentLinesQuery(
    lines,
    {
      display: displayValuationMode,
      asOfDate: valuationAsOfDate,
      realTermsBaseMonth,
    },
    opts.enabled && lines.length > 0,
  );

  const rowMap = useMemo(() => rowsToMap(rows), [rows]);
  const chartCurrency = presentedCurrencyFromRows(rows, displayValuationMode);

  const num = useCallback(
    (id: string, copFallback: number): number => {
      const r = rowMap.get(id);
      return r ? r.presentedAmount : copFallback;
    },
    [rowMap],
  );

  const fmt = useCallback(
    (id: string, copFallback: number): string => {
      if (opts.enabled && isLoading && lines.length > 0) return '…';
      const r = rowMap.get(id);
      if (r) return formatPresentedAmount(r.presentedAmount, r.presentedCurrency);
      return formatPresentedAmount(copFallback, 'COP');
    },
    [rowMap, opts.enabled, isLoading, lines.length],
  );

  return {
    rowMap,
    chartCurrency,
    isLoading: opts.enabled && isLoading && lines.length > 0,
    linesCount: lines.length,
    fmt,
    num,
  };
}
