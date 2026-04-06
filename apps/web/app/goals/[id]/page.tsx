'use client';
import React, { useEffect, useMemo } from 'react';
import { Zap, Activity } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useGoalScenarios, useSimulateGoalScenarios } from '@/features/goals/api/queries';
import { GoalSnapshot, GoalScenarios } from '@/features/goals/components';
import { useValuationPresentation } from '@/features/currency/hooks/useValuationPresentation';
import { presentedCurrencyFromRows } from '@/features/currency/valuationUtils';
import { useGlobalStore } from '@/shared/store/global';

export default function GoalDetailPage() {
  const params = useParams();
  const goalId = typeof params.id === 'string' ? params.id : '';

  const { data: scenarioSnapshot, isLoading } = useGoalScenarios(goalId);
  const simulateMutation = useSimulateGoalScenarios(goalId);

  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);

  const goalSimLines = useMemo(() => {
    if (!scenarioSnapshot) return [];
    const d = valuationAsOfDate;
    const {
      monthlyAmountNeeded,
      targetAmount,
      currentMonthlySavings,
      monthlyShortfall,
      scenarios,
    } = scenarioSnapshot;
    const base = [
      {
        id: 'gs-needed',
        amount: Number(monthlyAmountNeeded),
        currency: 'COP',
        valueDate: d,
      },
      {
        id: 'gs-target',
        amount: Number(targetAmount),
        currency: 'COP',
        valueDate: d,
      },
      {
        id: 'gs-savings',
        amount: Number(currentMonthlySavings),
        currency: 'COP',
        valueDate: d,
      },
      {
        id: 'gs-shortfall',
        amount: Number(monthlyShortfall),
        currency: 'COP',
        valueDate: d,
      },
    ];
    const fromScen = (scenarios || []).flatMap((s: { id: string; incomeIncreaseAmount?: unknown; expenseReductionAmount?: unknown }) => [
      {
        id: `gs-${s.id}-inc`,
        amount: Number(s.incomeIncreaseAmount || 0),
        currency: 'COP',
        valueDate: d,
      },
      {
        id: `gs-${s.id}-exp`,
        amount: Number(s.expenseReductionAmount || 0),
        currency: 'COP',
        valueDate: d,
      },
    ]);
    return [...base, ...fromScen];
  }, [scenarioSnapshot, valuationAsOfDate]);

  const { data: simPresRows, isLoading: simPresLoading } = useValuationPresentation(
    goalSimLines,
    goalSimLines.length > 0,
  );

  const presentedSnapshot = useMemo(() => {
    if (!simPresRows?.length) return null;
    const find = (lineId: string) => simPresRows.find((r) => r.id === lineId);
    const n = find('gs-needed');
    const t = find('gs-target');
    const s = find('gs-savings');
    const sh = find('gs-shortfall');
    if (!n || !t || !s || !sh) return null;
    const ccy = presentedCurrencyFromRows(simPresRows, displayValuationMode);
    return {
      monthlyAmountNeeded: n.presentedAmount,
      targetAmount: t.presentedAmount,
      currentMonthlySavings: s.presentedAmount,
      monthlyShortfall: sh.presentedAmount,
      currency: ccy,
    };
  }, [simPresRows, displayValuationMode]);

  const presentedByScenarioId = useMemo(() => {
    const scenarios = scenarioSnapshot?.scenarios;
    if (!simPresRows?.length || !scenarios?.length) return undefined;
    const ccy = presentedCurrencyFromRows(simPresRows, displayValuationMode);
    const m: Record<string, { income?: number; expense?: number; currency: string }> = {};
    for (const s of scenarios as Array<{
      id: string;
      incomeIncreaseAmount?: unknown;
      expenseReductionAmount?: unknown;
    }>) {
      const inc = simPresRows.find((r) => r.id === `gs-${s.id}-inc`);
      const exp = simPresRows.find((r) => r.id === `gs-${s.id}-exp`);
      const hasInc = Number(s.incomeIncreaseAmount) > 0;
      const hasExp = Number(s.expenseReductionAmount) > 0;
      if (!hasInc && !hasExp) continue;
      m[s.id] = { currency: ccy };
      if (hasInc && inc) m[s.id].income = inc.presentedAmount;
      if (hasExp && exp) m[s.id].expense = exp.presentedAmount;
    }
    return Object.keys(m).length ? m : undefined;
  }, [simPresRows, scenarioSnapshot?.scenarios, displayValuationMode]);

  useEffect(() => {
    if (
      !goalId ||
      isLoading ||
      scenarioSnapshot != null ||
      simulateMutation.isPending ||
      simulateMutation.isSuccess ||
      simulateMutation.isError
    ) {
      return;
    }
    simulateMutation.mutate();
  }, [
    goalId,
    isLoading,
    scenarioSnapshot,
    simulateMutation.isPending,
    simulateMutation.isSuccess,
    simulateMutation.isError,
    simulateMutation.mutate,
  ]);

  if (!goalId) {
    return (
      <div className="text-center py-20 text-slate-600">
        <p>Meta no válida.</p>
        <Link href="/goals" className="mt-4 inline-block text-blue-600 text-sm">
          Volver a metas
        </Link>
      </div>
    );
  }

  if (isLoading || (simulateMutation.isPending && !scenarioSnapshot)) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400">
        <Activity className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!scenarioSnapshot) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-700">No se pudo generar la simulación.</h2>
        <p className="text-slate-500 mt-2">
          Comprueba que la meta existe y que hay datos de cashflow en la app.
        </p>
        <button
          type="button"
          onClick={() => simulateMutation.mutate()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const {
    currentMonthlySavings,
    targetAmount,
    monthsRemaining,
    monthlyAmountNeeded,
    monthlyShortfall,
    currentProjectedMonths,
    scenarios,
  } = scenarioSnapshot;

  const isAchievable = Number(monthlyShortfall) <= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <Link href="/goals" className="hover:text-blue-600">
          Metas
        </Link>
        <span>/</span>
        <span>Escenarios</span>
      </div>

      <header className="flex justify-between items-end border-b border-slate-200/50 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1 bg-blue-100 rounded-md">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            Simulación de meta
          </h1>
          <p className="text-slate-500 mt-1 max-w-2xl text-xs leading-relaxed">
            Proyecciones condicionales según tus flujos registrados y {Number(monthsRemaining)} meses en el horizonte
            del modelo. No sustituye asesoría personalizada.
          </p>
        </div>
        <button
          type="button"
          onClick={() => simulateMutation.mutate()}
          disabled={simulateMutation.isPending}
          className="glass-card hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
        >
          {simulateMutation.isPending && <Activity className="w-3 h-3 animate-spin" />}
          {simulateMutation.isPending ? 'Recalculando…' : 'Volver a simular'}
        </button>
      </header>

      <GoalSnapshot
        monthlyAmountNeeded={monthlyAmountNeeded}
        targetAmount={targetAmount}
        currentMonthlySavings={currentMonthlySavings}
        monthlyShortfall={monthlyShortfall}
        isAchievable={isAchievable}
        currentProjectedMonths={currentProjectedMonths}
        monthsRemaining={monthsRemaining}
        presented={presentedSnapshot}
        presentationLoading={simPresLoading}
      />

      <GoalScenarios
        scenarios={scenarios}
        isAchievable={isAchievable}
        currentMonthlySavings={currentMonthlySavings}
        presentedSavings={presentedSnapshot?.currentMonthlySavings ?? null}
        presentedSavingsCurrency={presentedSnapshot?.currency}
        presentedByScenarioId={presentedByScenarioId}
        presentationLoading={simPresLoading}
      />
    </div>
  );
}
