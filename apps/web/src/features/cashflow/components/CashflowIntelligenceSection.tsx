'use client';

import React from 'react';
import { Lightbulb, Wallet } from 'lucide-react';
import { formatPresentedAmount } from '@/features/currency/format';
import type { CashflowIntelligenceResponse } from '@/features/cashflow/types/cashflowIntelligence';
import { MonthlyCashflowTrendChart } from '@/features/dashboard/components/MonthlyCashflowTrendChart';
import { CashflowFixedVariableChart } from './CashflowFixedVariableChart';
import { CashflowRollingStats } from './CashflowRollingStats';
import { CashflowCategoryWeightBar } from './CashflowCategoryWeightBar';

export function CashflowIntelligenceSection({
  data,
  isLoading,
  chartCurrency,
}: {
  data: CashflowIntelligenceResponse | undefined;
  isLoading: boolean;
  chartCurrency: string;
}) {
  const fmt = (n: number) => formatPresentedAmount(n, chartCurrency);

  if (isLoading && !data) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
        Analizando patrones de cashflow…
      </div>
    );
  }

  if (!data) return null;

  const { model, insights, monthly, rolling, expenseByCategory } = data;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Lightbulb className="h-5 w-5 text-amber-500" aria-hidden />
        <div>
          <h2 className="text-sm font-bold text-slate-900">Patrones e insights</h2>
          <p className="text-[10px] text-slate-500">
            Modelo mensual (streams) + eventos reales para tendencias. Montos en moneda de libro del
            stream.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900/80 mb-2">
          Lecturas automáticas
        </p>
        <ul className="space-y-2">
          {insights.slice(0, 8).map((line, i) => (
            <li key={i} className="text-xs text-amber-950/90 leading-relaxed flex gap-2">
              <span className="text-amber-600 shrink-0">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Capacidad y salario principal</h3>
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Flujo libre post-fijos</dt>
              <dd className="font-semibold text-slate-900 tabular-nums">
                {fmt(model.freeCashAfterFixedExpenses)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Gastos fijos / ingresos</dt>
              <dd className="font-semibold text-slate-900 tabular-nums">
                {model.fixedExpenseShareOfIncome !== null
                  ? `${(model.fixedExpenseShareOfIncome * 100).toFixed(1)} %`
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Tasa de ahorro (modelo)</dt>
              <dd className="font-semibold text-slate-900 tabular-nums">
                {model.savingsRate !== null
                  ? `${(model.savingsRate * 100).toFixed(1)} %`
                  : '—'}
              </dd>
            </div>
            {model.mainIncomeStream ? (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-500">Ingreso principal (mayor monto esperado)</p>
                <p className="font-semibold text-slate-900 mt-0.5">{model.mainIncomeStream.name}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {fmt(model.mainIncomeStream.amount)} ·{' '}
                  {(model.mainIncomeStream.shareOfIncome * 100).toFixed(0)}% del total de ingresos
                </p>
              </div>
            ) : null}
          </dl>
        </div>

        <CashflowRollingStats
          avgNet3={rolling.avgNet3}
          avgNet6={rolling.avgNet6}
          avgNet12={rolling.avgNet12}
          chartCurrency={chartCurrency}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CashflowFixedVariableChart
          incomeFixed={model.incomeFixed}
          incomeVariable={model.incomeVariable}
          expenseFixed={model.expenseFixed}
          expenseVariable={model.expenseVariable}
          chartCurrency={chartCurrency}
        />
        <CashflowCategoryWeightBar rows={expenseByCategory} chartCurrency={chartCurrency} />
      </div>

      <MonthlyCashflowTrendChart
        series={monthly.series}
        chartCurrency={chartCurrency}
        isLoading={false}
        eventCount={monthly.eventCount}
      />
    </section>
  );
}
