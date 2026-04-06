'use client';

import React from 'react';
import { Compass, TrendingUp, Calendar, Activity } from 'lucide-react';
import { formatBookAmount } from '@/features/currency/format';
import type { GoalProjectionResponse } from '@/features/goals/types/goalProjection';

function feasibilityLabel(level: string) {
  switch (level) {
    case 'CONSERVATIVE':
      return 'Conservador';
    case 'REASONABLE':
      return 'Razonable';
    case 'AGGRESSIVE':
      return 'Exigente';
    case 'UNREALISTIC':
      return 'Muy difícil';
    default:
      return level;
  }
}

export function GoalProjectionPanel({
  data,
  isLoading,
}: {
  data: GoalProjectionResponse | undefined;
  isLoading: boolean;
}) {
  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-12 text-slate-400">
        <Activity className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { strategy, scenarios, disclaimers, cashContext } = data;
  const book = cashContext.goalCurrency === 'USD' ? 'USD' : 'COP';
  const cfS = cashContext.cashflowMonthlySavings ?? cashContext.currentMonthlySavings;
  const uM = cashContext.utilityMonthly ?? 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Compass className="h-5 w-5 text-indigo-600" aria-hidden />
        <div>
          <h2 className="text-base font-bold text-slate-900">Proyección y guidance</h2>
          <p className="text-[10px] text-slate-500">
            Tiempos a meta, horizontes 5 y 15 años, y separación aporte vs rendimiento ilustrativo.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-900/80 mb-1">
          Estrategia sugerida (modelo)
        </p>
        <h3 className="text-sm font-bold text-indigo-950">{strategy.title}</h3>
        <p className="text-xs text-indigo-900/90 leading-relaxed mt-2">{strategy.detail}</p>
        <p className="text-[10px] text-indigo-800/70 mt-2">
          Escenario referencia: <strong>{strategy.recommendedScenarioKey}</strong> · Factibilidad:{' '}
          {feasibilityLabel(strategy.feasibility)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-2 font-semibold text-slate-700">Escenario</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Tasa (a.a.)</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Meses a meta</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Meta ~fecha</th>
              <th className="px-3 py-2 font-semibold text-slate-700">5 años · crecimiento</th>
              <th className="px-3 py-2 font-semibold text-slate-700">15 años · crecimiento</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Nivel</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr key={s.key} className="border-b border-slate-50 align-top">
                <td className="px-3 py-2">
                  <p className="font-semibold text-slate-900">{s.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[14rem] leading-snug">
                    {s.narrative}
                  </p>
                </td>
                <td className="px-3 py-2 tabular-nums">{s.annualReturnPct}%</td>
                <td className="px-3 py-2 tabular-nums">
                  {s.monthsToTarget != null ? `${s.monthsToTarget}` : '—'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {s.estimatedReachDate ? (
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {s.estimatedReachDate}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2">
                  <GrowthCell h={s.horizon5y} book={book} />
                </td>
                <td className="px-3 py-2">
                  <GrowthCell h={s.horizon15y} book={book} />
                </td>
                <td className="px-3 py-2 text-[10px] font-medium text-slate-600">
                  {feasibilityLabel(s.feasibilityLevel)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-[10px] text-slate-600 leading-relaxed">
          <p className="font-bold text-slate-800 mb-1">Aporte vs rendimiento (5 y 15 años)</p>
          <p>
            «Crecimiento» es la parte del saldo final que no proviene de la suma simple de aportes (efecto
            compuesto ilustrativo). «Aportes» = saldo inicial + aportes mensuales × meses.
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-[10px] text-slate-600 leading-relaxed">
          <p className="font-bold text-slate-800 mb-1">Contexto de flujo</p>
          <p>
            Flujo (ing − gasto): <strong>{formatBookAmount(cfS, book)}</strong>
            {uM > 0 ? (
              <>
                {' '}
                + utilidades modelo: <strong>{formatBookAmount(uM, book)}</strong>/mes
              </>
            ) : null}{' '}
            → ahorro modelado:{' '}
            <strong>{formatBookAmount(cashContext.currentMonthlySavings, book)}</strong> · Requerido:{' '}
            <strong>{formatBookAmount(cashContext.monthlyAmountNeeded, book)}</strong> · Plazo:{' '}
            {cashContext.monthsRemainingModel} meses ({book}).
          </p>
        </div>
      </div>

      <ul className="text-[9px] text-slate-400 space-y-1 list-disc pl-4">
        {disclaimers.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </section>
  );
}

function GrowthCell({
  h,
  book,
}: {
  h: { futureValue: number; contributions: number; growth: number };
  book: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="font-semibold text-slate-800 flex items-center gap-0.5">
        <TrendingUp className="w-3 h-3 text-emerald-600" />
        {formatBookAmount(h.futureValue, book)}
      </p>
      <p className="text-[9px] text-slate-500">
        Aportes {formatBookAmount(h.contributions, book)} · Crec.{' '}
        {formatBookAmount(h.growth, book)}
      </p>
    </div>
  );
}
