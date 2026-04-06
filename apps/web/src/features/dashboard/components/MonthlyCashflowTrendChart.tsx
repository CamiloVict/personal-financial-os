'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity } from 'lucide-react';
import { formatPresentedAmount } from '@/features/currency/format';
import type { MonthlyCashflowPoint } from '@/features/dashboard/api/queries';

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
  });
}

export function MonthlyCashflowTrendChart({
  series,
  chartCurrency,
  isLoading,
  eventCount,
}: {
  series: MonthlyCashflowPoint[];
  chartCurrency: string;
  isLoading: boolean;
  eventCount: number;
}) {
  const data = series.map((p) => ({
    ...p,
    label: monthLabel(p.month),
  }));

  const fmt = (v: number) => formatPresentedAmount(v, chartCurrency);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <Activity className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  const hasActivity = eventCount > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Evolución de cashflow</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Ingresos vs gastos por mes (eventos registrados). Últimos 12 meses.
          </p>
        </div>
        <p className="text-[10px] text-slate-400">
          {hasActivity ? `${eventCount} evento(s)` : 'Sin eventos aún'}
        </p>
      </div>
      {!hasActivity ? (
        <p className="rounded-lg bg-slate-50 border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
          Registrá pagos o ingresos reales en Cashflow para ver la tendencia mensual.
        </p>
      ) : (
        <div className="h-64 w-full min-h-[16rem]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#94a3b8"
                tickFormatter={(v) =>
                  chartCurrency === 'USD'
                    ? `$${Number(v) / 1000}k`
                    : `${(Number(v) / 1e6).toFixed(1)}M`
                }
              />
              <Tooltip
                formatter={(value) => fmt(Number(value ?? 0))}
                labelFormatter={(label) => String(label)}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="net"
                name="Neto"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
