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
import { useProductInsights } from '@/features/dashboard/api/queries';
import { InsightsContextStrip } from '@/features/dashboard/components';
import { ErrorState } from '@/shared/ui/ErrorState';

export default function DebtsPage() {
  const {
    data: analysis,
    isLoading: loadingLeverage,
    isError: leverageError,
    refetch: refetchLeverage,
  } = useLeverageAnalysis();
  const { data: productInsightsPayload, isLoading: loadingProductInsights } =
    useProductInsights();
  const leverageReady = !loadingLeverage && !!analysis;
  const {
    data: debtsList = [],
    isError: debtsError,
    refetch: refetchDebts,
  } = useDebtsList(leverageReady);
  const patchDebt = usePatchDebt();
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);

  const onToggleDebtAutoApply = useCallback(
    (id: string, autoApplyMonthlyPayment: boolean) => {
      patchDebt.mutate({ id, body: { autoApplyMonthlyPayment } });
    },
    [patchDebt],
  );

  const onSaveDebtTerms = useCallback(
    (id: string, body: { monthlyPayment: number; interestRate: number }) => {
      patchDebt.mutate({ id, body });
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

  if (loadingLeverage && !leverageError) {
    return (
      <div className="flex justify-center items-center py-20">
        <Activity className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (leverageError) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <DebtsPageHeader />
        <InsightsContextStrip
          insights={productInsightsPayload?.insights}
          modules={['debts']}
          includeGlobal={false}
          loading={loadingProductInsights}
          max={2}
        />
        <ErrorState
          title="No se pudo cargar el análisis de apalancamiento"
          description="No podemos mostrar tu salud de endeudamiento ahora. Comprueba la conexión o reintenta."
          className="rounded-2xl"
        >
          <button
            type="button"
            onClick={() => void refetchLeverage()}
            className="mx-auto rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Reintentar
          </button>
        </ErrorState>
      </div>
    );
  }

  if (!analysis) return null;

  const a = analysis as LeverageAnalysis;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <DebtsPageHeader confidence={a.confidence} />

      <InsightsContextStrip
        insights={productInsightsPayload?.insights}
        modules={['debts']}
        includeGlobal={false}
        loading={loadingProductInsights}
        max={2}
      />

      <ExplanationPanel explanation={a.explanation} defaultOpen={false} />

      {debtsError ? (
        <ErrorState
          variant="compact"
          title="No se pudo cargar el detalle de deudas"
          description="El resumen de apalancamiento se muestra; la lista para valuación puede estar incompleta hasta que reintentes."
          className="rounded-xl py-4"
        >
          <button
            type="button"
            onClick={() => void refetchDebts()}
            className="text-xs font-semibold text-rose-900 underline underline-offset-2 hover:text-rose-950"
          >
            Reintentar
          </button>
        </ErrorState>
      ) : null}

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
              onSaveDebtTerms={onSaveDebtTerms}
              patchDebtPending={patchDebt.isPending}
            />
            <DebtsBadDebtPanel
              badDebts={a.badDebts}
              presentedByDebtId={presentedByDebtId}
              presentationLoading={presLoading}
              onToggleDebtAutoApply={onToggleDebtAutoApply}
              onSaveDebtTerms={onSaveDebtTerms}
              patchDebtPending={patchDebt.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
