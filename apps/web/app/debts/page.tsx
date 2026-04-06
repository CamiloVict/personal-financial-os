'use client';

import { useCallback, useMemo } from 'react';
import { Activity } from 'lucide-react';
import {
  useDebtsList,
  useLeverageAnalysis,
  usePatchDebt,
} from '@/features/debts/api/queries';
import type { LeverageAnalysis } from '@/features/debts/types';
import {
  DebtsPageHeader,
  DebtsEmptyTotal,
  DebtsOverviewSidebar,
  DebtsGoodDebtPanel,
  DebtsBadDebtPanel,
} from '@/features/debts/components';
import { ExplanationPanel } from '@/shared/ui/ExplanationPanel';
import { useValuationPresentation } from '@/features/currency/hooks/useValuationPresentation';
import {
  linesFromDebts,
  presentedCurrencyFromRows,
} from '@/features/currency/valuationUtils';
import { useGlobalStore } from '@/shared/store/global';

export default function DebtsPage() {
  const { data: analysis, isLoading } = useLeverageAnalysis();
  const { data: debtsList = [] } = useDebtsList(!isLoading && !!analysis);
  const patchDebt = usePatchDebt();
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);

  const onToggleDebtAutoApply = useCallback(
    (id: string, autoApplyMonthlyPayment: boolean) => {
      patchDebt.mutate({ id, body: { autoApplyMonthlyPayment } });
    },
    [patchDebt],
  );

  const debtLines = useMemo(() => linesFromDebts(debtsList), [debtsList]);
  const { data: presRows, isLoading: presLoading } = useValuationPresentation(
    debtLines,
    debtLines.length > 0,
  );

  const presentedByDebtId = useMemo(() => {
    if (!presRows?.length) return undefined;
    const ccy = presentedCurrencyFromRows(presRows, displayValuationMode);
    const m: Record<string, { amount: number; currency: string }> = {};
    for (const r of presRows) {
      m[r.id] = { amount: r.presentedAmount, currency: ccy };
    }
    return m;
  }, [presRows, displayValuationMode]);

  const presentedTotalsForAnalysis = useMemo(() => {
    if (!analysis || !presentedByDebtId) return null;
    const a = analysis as LeverageAnalysis;
    const sumIds = (ids: string[]) =>
      ids.reduce((acc, id) => acc + (presentedByDebtId[id]?.amount ?? 0), 0);
    const goodIds = a.goodDebts.map((g) => g.id);
    const badIds = a.badDebts.map((b) => b.id);
    const allIds = debtsList.map((d: { id: string }) => d.id);
    const ccy =
      presRows?.[0]?.presentedCurrency ??
      (displayValuationMode === 'NOMINAL_USD' ? 'USD' : 'COP');
    return {
      totalDebt: sumIds(allIds),
      goodDebtTotal: sumIds(goodIds),
      badDebtTotal: sumIds(badIds),
      currency: ccy,
    };
  }, [analysis, presentedByDebtId, presRows, displayValuationMode, debtsList]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Activity className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!analysis) return null;

  const a = analysis as LeverageAnalysis;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <DebtsPageHeader confidence={a.confidence} />

      <ExplanationPanel explanation={a.explanation} defaultOpen={false} />

      {a.totalDebt === 0 ? (
        <DebtsEmptyTotal />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <DebtsOverviewSidebar
            analysis={a}
            presentedTotals={presentedTotalsForAnalysis}
            presentationLoading={presLoading && debtLines.length > 0}
            fallbackBookCurrency={debtsList[0]?.currency ?? 'COP'}
          />
          <div className="lg:col-span-8 space-y-4">
            <DebtsGoodDebtPanel
              goodDebts={a.goodDebts}
              presentedByDebtId={presentedByDebtId}
              presentationLoading={presLoading}
              onToggleDebtAutoApply={onToggleDebtAutoApply}
              patchDebtPending={patchDebt.isPending}
            />
            <DebtsBadDebtPanel
              badDebts={a.badDebts}
              presentedByDebtId={presentedByDebtId}
              presentationLoading={presLoading}
              onToggleDebtAutoApply={onToggleDebtAutoApply}
              patchDebtPending={patchDebt.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
