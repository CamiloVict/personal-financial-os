'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, Activity } from 'lucide-react';
import {
  useCashflowStreams,
  useCashflowAnalytics,
} from '@/features/cashflow/api/queries';
import { useTaxAnalytics } from '@/features/tax/api/queries';
import { useInvestmentPositions } from '@/features/investments/api/queries';
import {
  DashboardMetrics,
  CashflowCharts,
  TaxAnalysisChart,
  TopInvestments,
  QuickActions,
} from '@/features/dashboard/components';
import { ExplanationPanel } from '@/shared/ui/ExplanationPanel';
import { useValuationPresentation } from '@/features/currency/hooks/useValuationPresentation';
import {
  linesFromStreams,
  linesFromPositions,
  linesFromDashboardTaxScenarios,
  rowsToMap,
  aggregateExpensePieByCategory,
  aggregateIncomeBarByType,
  sumPositionPresented,
  presentedCurrencyFromRows,
} from '@/features/currency/valuationUtils';
import { useGlobalStore } from '@/shared/store/global';

/** Al menos un flujo de caja (ingreso o gasto) o una inversión */
function hasFinancialSetup(
  streams: unknown[],
  positions: unknown[],
) {
  return streams.length > 0 || positions.length > 0;
}

export default function HomePage() {
  const router = useRouter();
  const { data: streams = [], isLoading: loadingStreams } = useCashflowStreams();
  const { data: cashflowAnalytics, isLoading: isLoadingCashflow } =
    useCashflowAnalytics();
  const { data: taxAnalytics, isLoading: isLoadingTax } = useTaxAnalytics();
  const { data: positionsPayload, isLoading: loadingPositions } =
    useInvestmentPositions();
  const positions = positionsPayload?.positions ?? [];

  const gateReady = !loadingStreams && !loadingPositions;
  const hasSetup = useMemo(
    () => hasFinancialSetup(streams, positions),
    [streams, positions],
  );

  useEffect(() => {
    if (!gateReady || hasSetup) return;
    router.replace('/cashflow');
  }, [gateReady, hasSetup, router]);

  const totalInvested = positions.reduce(
    (acc: number, pos: { initialCapital?: number | string }) =>
      acc + Number(pos.initialCapital),
    0,
  );
  const totalEstimatedValue = positions.reduce(
    (acc: number, pos: { currentEstimatedValue?: number | string }) =>
      acc + Number(pos.currentEstimatedValue),
    0,
  );
  const totalReturn = totalEstimatedValue - totalInvested;
  const returnPercentage =
    totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);

  const taxScenarioLines = useMemo(
    () =>
      linesFromDashboardTaxScenarios(
        taxAnalytics?.scenariosComparison,
        valuationAsOfDate,
      ),
    [taxAnalytics?.scenariosComparison, valuationAsOfDate],
  );

  const valuationLines = useMemo(() => {
    const fromStreams = linesFromStreams(streams);
    const fromPos = linesFromPositions(positions, valuationAsOfDate);
    return [...fromStreams, ...fromPos, ...taxScenarioLines];
  }, [streams, positions, valuationAsOfDate, taxScenarioLines]);

  const { data: presentedRows, isLoading: presentationLoading } =
    useValuationPresentation(valuationLines, valuationLines.length > 0);

  const rowMap = useMemo(() => rowsToMap(presentedRows), [presentedRows]);

  const presentedTaxComparison = useMemo(() => {
    const sc = taxAnalytics?.scenariosComparison;
    if (!sc?.length) return null;
    return sc.map((s: any, i: number) => ({
      name: s.name,
      taxableBase:
        rowMap.get(`dash-tax-${i}-taxableBase`)?.presentedAmount ??
        Number(s.taxableBase),
      taxLiability:
        rowMap.get(`dash-tax-${i}-taxLiability`)?.presentedAmount ??
        Number(s.taxLiability),
      netTaxPayable:
        rowMap.get(`dash-tax-${i}-netTaxPayable`)?.presentedAmount ??
        Number(s.netTaxPayable),
    }));
  }, [taxAnalytics?.scenariosComparison, rowMap]);
  const expenseChartData = useMemo(
    () => aggregateExpensePieByCategory(streams, rowMap),
    [streams, rowMap],
  );
  const incomeChartData = useMemo(
    () => aggregateIncomeBarByType(streams, rowMap),
    [streams, rowMap],
  );
  const chartCurrency = presentedCurrencyFromRows(
    presentedRows,
    displayValuationMode,
  );

  const hasStreamPresentation =
    streams.length > 0 &&
    !presentationLoading &&
    (presentedRows?.length ?? 0) > 0;

  const { invested: pInv, value: pVal, currency: posPresCcy } =
    sumPositionPresented(positions, presentedRows);
  const pRet =
    pInv != null && pVal != null ? pVal - pInv : null;

  const presentedById = useMemo(() => {
    if (!presentedRows?.length || positions.length === 0) return undefined;
    const ccy = presentedRows[0]?.presentedCurrency ?? posPresCcy;
    const m: Record<string, { capital: number; value: number; currency: string }> =
      {};
    for (const p of positions) {
      const c = presentedRows.find((r) => r.id === `${p.id}-cap`);
      const v = presentedRows.find((r) => r.id === `${p.id}-val`);
      if (c && v) {
        m[p.id] = {
          capital: c.presentedAmount,
          value: v.presentedAmount,
          currency: ccy,
        };
      }
    }
    return Object.keys(m).length ? m : undefined;
  }, [presentedRows, positions, posPresCcy]);

  const showDashboard = gateReady && hasSetup;

  if (!showDashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <Activity className="w-8 h-8 animate-spin" />
        <p className="text-xs text-slate-500">Preparando tu espacio…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-slate-200 pb-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Analítico
          </h1>
          <p className="text-slate-500 mt-1 text-xs leading-relaxed">
            Una visión 360° de tus inversiones, flujos de caja y planeación
            fiscal.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/investment-positions"
            className="glass-card hover:bg-blue-600 hover:text-white hover:border-blue-500 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Nueva Inversión
          </Link>
        </div>
      </header>

      <>
        <DashboardMetrics
          totalInvested={totalInvested}
          totalEstimatedValue={totalEstimatedValue}
          totalReturn={totalReturn}
          returnPercentage={returnPercentage}
          presentedInvested={
            positions.length > 0 ? pInv : undefined
          }
          presentedValue={positions.length > 0 ? pVal : undefined}
          presentedReturn={positions.length > 0 ? pRet : undefined}
          presentedCurrency={posPresCcy}
          presentationLoading={
            positions.length > 0 && presentationLoading
          }
          bookCurrencyFallback={positions[0]?.currency ?? 'COP'}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <CashflowCharts
            isLoading={isLoadingCashflow}
            analytics={cashflowAnalytics}
            expenseChartData={
              hasStreamPresentation ? expenseChartData : undefined
            }
            incomeChartData={
              hasStreamPresentation ? incomeChartData : undefined
            }
            chartCurrency={hasStreamPresentation ? chartCurrency : 'USD'}
            presentationLoading={
              streams.length > 0 && presentationLoading
            }
          />

          <div className="lg:col-span-5 flex flex-col gap-4">
            <TaxAnalysisChart
              isLoading={isLoadingTax}
              analytics={taxAnalytics}
              chartData={presentedTaxComparison ?? undefined}
              chartCurrency={chartCurrency}
              presentationLoading={
                taxScenarioLines.length > 0 && presentationLoading
              }
            />
            <ExplanationPanel explanation={taxAnalytics?.explanation} defaultOpen={false} />
            <QuickActions />
          </div>

          <div className="lg:col-span-3">
            <TopInvestments
              positions={positions}
              confidence={positionsPayload?.confidence}
              presentedById={presentedById}
              presentationLoading={
                positions.length > 0 && presentationLoading
              }
            />
          </div>
        </div>
      </>
    </div>
  );
}
