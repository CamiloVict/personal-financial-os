'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatPresentedAmount } from '@/features/currency/format';

const COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#64748b', '#ec4899'];

export function NetWorthCompositionChart({
  composition,
  chartCurrency,
}: {
  composition: { name: string; value: number }[];
  chartCurrency: string;
}) {
  const data = composition.filter((c) => c.value > 0);
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Composición patrimonial</h3>
        <p className="mt-4 text-center text-xs text-slate-500">
          Sin posiciones activas para mostrar composición por tipo.
        </p>
      </div>
    );
  }

  const fmt = (v: number) => formatPresentedAmount(v, chartCurrency);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">Composición patrimonial</h3>
      <p className="text-[10px] text-slate-500 mt-0.5 mb-2">
        Por tipo de inversión (valor estimado actual).
      </p>
      <div className="h-52 w-full min-h-[13rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={72}
              label={({ name, percent }) =>
                `${name} ${((percent as number) * 100).toFixed(0)}%`
              }
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
