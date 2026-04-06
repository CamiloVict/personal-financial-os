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
import { useGoals } from '@/features/goals/api/queries';
import { useLeverageAnalysis } from '@/features/debts/api/queries';
import {
  useCashflowMonthlyTrend,
  useNetWorthAnalytics,
} from '@/features/dashboard/api/queries';
import {
  CashflowCharts,
  TaxAnalysisChart,
  TopInvestments,
  QuickActions,
  PlanningShortcuts,
  FinancialHealthHero,
  FinancialHealthKpiStrip,
  MonthlyCashflowTrendChart,
  NetWorthCompositionChart,
  GoalsProgressPanel,
  FiscalHealthAlert,
} from '@/features/dashboard/components';
import type { GoalProgressRow } from '@/features/dashboard/components';
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
import { formatPresentedAmount } from '@/features/currency/format';
import { useGlobalStore } from '@/shared/store/global';
import { pickFinancialHealthRecommendation } from '@/features/dashboard/model/financialHealthRecommendation';

function hasFinancialSetup(streams: unknown[], positions: unknown[]) {
  return streams.length > 0 || positions.length > 0;
}

function sumPresentedForStreamIds(
  ids: string[],
  rowMap: Map<string, { presentedAmount: number }>,
): number | null {
  if (ids.length === 0) return 0;
  let t = 0;
  for (const id of ids) {
    const r = rowMap.get(id);
    if (!r) return null;
    t += r.presentedAmount;
  }
  return t;
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
  const { data: goals = [], isLoading: loadingGoals } = useGoals();
  const { data: leverageAnalysis, isLoading: loadingLeverage } =
    useLeverageAnalysis();
  const { data: monthlyTrend, isLoading: loadingMonthly } =
    useCashflowMonthlyTrend();
  const { data: netWorthPayload, isLoading: loadingNetWorth } =
    useNetWorthAnalytics();

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

  const incomeStreams = useMemo(
    () => streams.filter((s: { flowType?: string }) => s.flowType === 'INCOME'),
    [streams],
  );
  const expenseStreams = useMemo(
    () => streams.filter((s: { flowType?: string }) => s.flowType === 'EXPENSE'),
    [streams],
  );
  const incomeIds = useMemo(
    () => incomeStreams.map((s: { id: string }) => s.id),
    [incomeStreams],
  );
  const expenseIds = useMemo(
    () => expenseStreams.map((s: { id: string }) => s.id),
    [expenseStreams],
  );

  const totalExpectedIncome = incomeStreams.reduce(
    (acc: number, s: { expectedAmount?: unknown }) =>
      acc + Number(s.expectedAmount),
    0,
  );
  const totalExpectedExpense = expenseStreams.reduce(
    (acc: number, s: { expectedAmount?: unknown }) =>
      acc + Number(s.expectedAmount),
    0,
  );

  const presentedIncome = sumPresentedForStreamIds(incomeIds, rowMap);
  const presentedExpense = sumPresentedForStreamIds(expenseIds, rowMap);

  const incomeKpi =
    presentedIncome !== null ? presentedIncome : totalExpectedIncome;
  const expenseKpi =
    presentedExpense !== null ? presentedExpense : totalExpectedExpense;
  const savingsKpi = incomeKpi - expenseKpi;
  const savingsRate =
    incomeKpi > 0 ? savingsKpi / incomeKpi : null;

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

  const portfolioValue =
    pVal != null ? pVal : totalEstimatedValue;

  const totalDebt =
    leverageAnalysis != null
      ? Number((leverageAnalysis as { totalDebt?: number }).totalDebt ?? 0)
      : null;

  const netWorthApprox =
    totalDebt !== null ? portfolioValue - totalDebt : null;

  const goalsProgress: GoalProgressRow[] = useMemo(() => {
    return goals.map((g: { id: string; name: string; targetAmount?: unknown; currentAmount?: unknown }) => {
      const target = Number(g.targetAmount) || 0;
      const current = Number(g.currentAmount) || 0;
      const progress = target > 0 ? Math.min(1, current / target) : 0;
      return { id: g.id, name: g.name, progress };
    });
  }, [goals]);

  const goalsAvgProgress = useMemo(() => {
    const withTarget = goals.filter(
      (g: { targetAmount?: unknown }) => Number(g.targetAmount) > 0,
    );
    if (withTarget.length === 0) return null;
    const sum = withTarget.reduce((acc, g: { targetAmount?: unknown; currentAmount?: unknown }) => {
      const t = Number(g.targetAmount);
      const c = Number(g.currentAmount);
      return acc + Math.min(1, t > 0 ? c / t : 0);
    }, 0);
    return sum / withTarget.length;
  }, [goals]);

  const taxHasScenarios = Boolean(
    taxAnalytics?.scenariosComparison?.length,
  );
  const taxConf = taxAnalytics?.confidence;

  const hero = useMemo(
    () =>
      pickFinancialHealthRecommendation({
        hasStreams: streams.length > 0,
        hasPositions: positions.length > 0,
        income: incomeKpi,
        expense: expenseKpi,
        savingsRate,
        totalDebt: totalDebt ?? 0,
        investmentsValue: portfolioValue,
        netWorthApprox: netWorthApprox ?? portfolioValue,
        goalsCount: goals.length,
        goalsAvgProgress,
        taxHasScenarios,
        taxConfidenceLevel: taxConf?.level,
        leverageRatio:
          leverageAnalysis != null
            ? Number((leverageAnalysis as { leverageRatio?: number }).leverageRatio ?? null)
            : null,
        cashflowEventCount: monthlyTrend?.eventCount ?? 0,
      }),
    [
      streams.length,
      positions.length,
      incomeKpi,
      expenseKpi,
      savingsRate,
      totalDebt,
      portfolioValue,
      netWorthApprox,
      goals.length,
      goalsAvgProgress,
      taxHasScenarios,
      taxConf?.level,
      leverageAnalysis,
      monthlyTrend?.eventCount,
    ],
  );

  const fmt = (n: number) => formatPresentedAmount(n, chartCurrency);

  const kpiLoading =
    (streams.length > 0 && presentationLoading) ||
    loadingLeverage ||
    loadingGoals;

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
      <header className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end border-b border-slate-200 pb-4 mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Salud financiera
          </h1>
          <p className="text-slate-500 mt-1 text-xs leading-relaxed max-w-xl">
            Resumen de flujo, patrimonio, metas y fiscal. Profundizá por módulo cuando necesites
            detalle.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/investment-positions"
            className="glass-card hover:bg-blue-600 hover:text-white hover:border-blue-500 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Nueva inversión
          </Link>
        </div>
      </header>

      <FinancialHealthHero hero={hero} />

      <FinancialHealthKpiStrip
        loading={kpiLoading}
        income={incomeKpi}
        expense={expenseKpi}
        savings={savingsKpi}
        savingsRatePct={savingsRate}
        totalDebt={totalDebt}
        netWorthApprox={netWorthApprox}
        portfolioValue={portfolioValue}
        totalReturn={pRet ?? totalReturn}
        returnPct={returnPercentage}
        fmt={fmt}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <MonthlyCashflowTrendChart
            series={monthlyTrend?.series ?? []}
            chartCurrency={chartCurrency}
            isLoading={loadingMonthly}
            eventCount={monthlyTrend?.eventCount ?? 0}
          />
        </div>
        <div className="lg:col-span-4 min-h-[280px]">
          <GoalsProgressPanel goals={goalsProgress} loading={loadingGoals} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <NetWorthCompositionChart
            composition={netWorthPayload?.composition ?? []}
            chartCurrency={chartCurrency}
          />
          {loadingNetWorth ? (
            <p className="text-[10px] text-slate-400 mt-1 text-center">Cargando composición…</p>
          ) : null}
        </div>
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
          gridClassName="lg:col-span-8 flex flex-col gap-4"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <FiscalHealthAlert
            scenariosReady={taxHasScenarios}
            confidence={taxConf}
          />
          <TaxAnalysisChart
            isLoading={isLoadingTax}
            analytics={taxAnalytics}
            chartData={presentedTaxComparison ?? undefined}
            chartCurrency={chartCurrency}
            presentationLoading={
              taxScenarioLines.length > 0 && presentationLoading
            }
          />
          <PlanningShortcuts />
          <ExplanationPanel
            explanation={taxAnalytics?.explanation}
            defaultOpen={false}
          />
          <QuickActions />
        </div>

        <div className="lg:col-span-5">
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
    </div>
  );
}
