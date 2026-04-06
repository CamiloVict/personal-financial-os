'use client';
import React, { useEffect } from 'react';
import { Zap, Activity } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useGoalScenarios, useSimulateGoalScenarios } from '@/features/goals/api/queries';
import { GoalSnapshot, GoalScenarios } from '@/features/goals/components';

export default function GoalDetailPage() {
  const { id } = useParams();

  const { data: scenarioSnapshot, isLoading } = useGoalScenarios(id as string);
  const simulateMutation = useSimulateGoalScenarios(id as string);

  useEffect(() => {
    if (
      !isLoading &&
      !scenarioSnapshot &&
      !simulateMutation.isPending &&
      !simulateMutation.isSuccess
    ) {
      simulateMutation.mutate();
    }
  }, [isLoading, scenarioSnapshot, simulateMutation]);

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
      />

      <GoalScenarios
        scenarios={scenarios}
        isAchievable={isAchievable}
        currentMonthlySavings={currentMonthlySavings}
      />
    </div>
  );
}
