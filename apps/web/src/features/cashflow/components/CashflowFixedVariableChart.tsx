'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatPresentedAmount } from '@/features/currency/format';

export function CashflowFixedVariableChart({
  incomeFixed,
  incomeVariable,
  expenseFixed,
  expenseVariable,
  chartCurrency,
}: {
  incomeFixed: number;
  incomeVariable: number;
  expenseFixed: number;
  expenseVariable: number;
  chartCurrency: string;
}) {
  const data = [
    { name: 'Ingresos', Fijo: incomeFixed, Variable: incomeVariable },
    { name: 'Gastos', Fijo: expenseFixed, Variable: expenseVariable },
  ];

  const fmt = (v: number) => formatPresentedAmount(v, chartCurrency);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">Fijo vs variable (modelo)</h3>
      <p className="text-[10px] text-slate-500 mt-0.5 mb-3">
        Suma de montos esperados por stream según tipo fijo o variable.
      </p>
      <div className="h-56 w-full min-h-[14rem]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="#64748b"
              tickFormatter={(v) =>
                chartCurrency === 'USD'
                  ? `$${Number(v) / 1000}k`
                  : `${(Number(v) / 1e6).toFixed(1)}M`
              }
            />
            <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Fijo" stackId="a" fill="#6366f1" />
            <Bar dataKey="Variable" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
