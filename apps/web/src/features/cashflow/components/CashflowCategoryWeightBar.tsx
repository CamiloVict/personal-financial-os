'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatPresentedAmount } from '@/features/currency/format';

const COL = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2'];

export function CashflowCategoryWeightBar({
  rows,
  chartCurrency,
}: {
  rows: { name: string; value: number; shareOfExpense: number }[];
  chartCurrency: string;
}) {
  const top = rows.slice(0, 6);
  if (top.length === 0) return null;

  const fmt = (v: number) => formatPresentedAmount(v, chartCurrency);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">Peso por categoría (gastos)</h3>
      <p className="text-[10px] text-slate-500 mt-0.5 mb-3">
        Montos modelados; barras ordenadas por magnitud.
      </p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
          >
            <XAxis type="number" tick={{ fontSize: 10 }} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={88}
              tick={{ fontSize: 10 }}
              stroke="#64748b"
            />
            <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {top.map((_, i) => (
                <Cell key={i} fill={COL[i % COL.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
