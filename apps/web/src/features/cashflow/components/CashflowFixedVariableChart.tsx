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
import {
  CHART_PALETTE,
  axisTickProps,
  chartMargins,
  legendStyle,
  tooltipContentStyle,
} from '@/shared/charts';

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
    <div className="chart-surface rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold tracking-tight text-slate-900">Fijo vs variable (modelo)</h3>
      <p className="mt-0.5 text-[10px] text-slate-500 mb-3">
        Suma de montos esperados por stream según tipo fijo o variable.
      </p>
      <div className="h-56 w-full min-h-[14rem]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargins.default}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.gridMuted} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTickProps} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={axisTickProps}
              tickFormatter={(v) =>
                chartCurrency === 'USD'
                  ? `$${Number(v) / 1000}k`
                  : `${(Number(v) / 1e6).toFixed(1)}M`
              }
            />
            <Tooltip
              formatter={(v: unknown) => fmt(Number(v ?? 0))}
              contentStyle={tooltipContentStyle}
            />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="Fijo" stackId="a" fill={CHART_PALETTE.fiscalNet} radius={[0, 0, 0, 0]} />
            <Bar
              dataKey="Variable"
              stackId="a"
              fill={CHART_PALETTE.series[2]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
