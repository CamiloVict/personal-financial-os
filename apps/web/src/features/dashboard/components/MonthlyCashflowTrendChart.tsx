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
import {
  CHART_PALETTE,
  chartMargins,
  axisTickProps,
  legendStyle,
  tooltipContentStyle,
} from '@/shared/charts';
import { EmptyState } from '@/shared/ui/EmptyState';

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
      <div className="chart-surface flex h-64 min-h-[16rem] items-center justify-center rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Activity className="h-8 w-8 animate-spin text-slate-300" aria-hidden />
          <span className="text-[10px] font-medium text-slate-400">Cargando tendencia…</span>
        </div>
      </div>
    );
  }

  const hasActivity = eventCount > 0;

  return (
    <div className="chart-surface rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Evolución de cashflow</h3>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
            Ingresos vs gastos por mes (eventos registrados). Últimos 12 meses.
          </p>
        </div>
        <p className="text-[10px] font-medium text-slate-400">
          {hasActivity ? `${eventCount} evento(s)` : 'Sin eventos aún'}
        </p>
      </div>
      {!hasActivity ? (
        <EmptyState
          title="Aún no hay eventos"
          description="Registrá pagos o ingresos reales en Cashflow para ver la tendencia mensual."
          variant="compact"
          className="border-slate-200/80 bg-slate-50/30"
        />
      ) : (
        <div className="h-64 min-h-[16rem] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={chartMargins.default}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} />
              <XAxis dataKey="label" tick={axisTickProps} stroke={CHART_PALETTE.axis} />
              <YAxis
                tick={axisTickProps}
                stroke={CHART_PALETTE.axis}
                tickFormatter={(v) =>
                  chartCurrency === 'USD'
                    ? `$${Number(v) / 1000}k`
                    : `${(Number(v) / 1e6).toFixed(1)}M`
                }
              />
              <Tooltip
                formatter={(value) => fmt(Number(value ?? 0))}
                labelFormatter={(label) => String(label)}
                contentStyle={tooltipContentStyle}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar
                dataKey="income"
                name="Ingresos"
                fill={CHART_PALETTE.positive}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Gastos"
                fill={CHART_PALETTE.expenseBar}
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Neto"
                stroke={CHART_PALETTE.netLine}
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
