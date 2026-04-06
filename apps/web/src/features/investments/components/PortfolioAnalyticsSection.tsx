'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Area,
  ComposedChart,
} from 'recharts';
import { formatPresentedAmount } from '@/features/currency/format';
import type { PortfolioAnalyticsResponse } from '../types/portfolioAnalytics';
import {
  CHART_PALETTE,
  axisTickProps,
  chartMargins,
  legendStyle,
  tooltipContentStyle,
} from '@/shared/charts';

const piePalette = CHART_PALETTE.series;
const tickSm = { ...axisTickProps, fontSize: 9 } as const;

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
  });
}

export type PortfolioAnalyticsSectionProps = {
  analytics: PortfolioAnalyticsResponse | undefined;
  loading: boolean;
  chartCurrency: string;
};

export function PortfolioAnalyticsSection({
  analytics,
  loading,
  chartCurrency,
}: PortfolioAnalyticsSectionProps) {
  const fmt = (v: unknown) =>
    formatPresentedAmount(Number(v ?? 0), chartCurrency);

  const yTick = (val: number) =>
    chartCurrency === 'USD' ? `$${val / 1000}k` : `${(val / 1e6).toFixed(1)}M`;

  const pieData = useMemo(() => {
    if (!analytics?.compositionByType.length) return [];
    return analytics.compositionByType.map((c) => ({
      name: c.generatesCashflow ? `${c.typeName} · flujo` : c.typeName,
      value: c.value,
      sharePct: c.sharePct,
    }));
  }, [analytics]);

  const flowMonthly = useMemo(() => {
    if (!analytics) return [];
    const { months, profitWithdrawn, profitReinvested } = analytics.monthly;
    return months.map((m, i) => ({
      month: monthLabel(m),
      key: m,
      retiradas: profitWithdrawn[i] ?? 0,
      reinvertidas: profitReinvested[i] ?? 0,
    }));
  }, [analytics]);

  const capitalMonthly = useMemo(() => {
    if (!analytics) return [];
    const { months, contributions, capitalWithdrawals } = analytics.monthly;
    return months.map((m, i) => ({
      month: monthLabel(m),
      key: m,
      aportes: contributions[i] ?? 0,
      retiros: capitalWithdrawals[i] ?? 0,
    }));
  }, [analytics]);

  const historyData = useMemo(() => {
    if (!analytics?.valueHistory.length) return [];
    return analytics.valueHistory.map((p) => ({
      ...p,
      label: p.date,
    }));
  }, [analytics]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 mb-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  if (!analytics || analytics.totals.positionCount === 0) {
    return null;
  }

  const { totals, profitFlow, capitalFlow, linkedDebts, disclaimers } = analytics;

  return (
    <section className="space-y-4 mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Analítica del portafolio
        </h2>
        <p className="text-[11px] text-slate-500">
          Valor y flujos en nominal (libro); convierte en la app para comparar monedas.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 border border-slate-200/60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Valor estimado
          </p>
          <p className="text-lg font-bold text-slate-900 tabular-nums">
            {fmt(totals.totalEstimatedValue)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-slate-200/60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Retorno acumulado (no realizado)
          </p>
          <p
            className={`text-lg font-bold tabular-nums ${
              totals.unrealizedGain >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {fmt(totals.unrealizedGain)}
            {totals.returnPct != null && (
              <span className="text-sm font-semibold text-slate-600 ml-1">
                ({totals.returnPct >= 0 ? '+' : ''}
                {totals.returnPct.toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-slate-200/60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Utilidades retiradas vs reinvertidas
          </p>
          <p className="text-sm text-slate-800 tabular-nums leading-snug">
            <span className="text-amber-700 font-semibold">
              {fmt(profitFlow.lifetimeWithdrawn)}
            </span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-emerald-700 font-semibold">
              {fmt(profitFlow.lifetimeReinvested)}
            </span>
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-slate-200/60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Aportes vs retiros de capital
          </p>
          <p className="text-sm text-slate-800 tabular-nums leading-snug">
            <span className="font-semibold">{fmt(capitalFlow.lifetimeContributions)}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="font-semibold">{fmt(capitalFlow.lifetimeWithdrawals)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 border border-slate-200/60">
          <h3 className="text-sm font-bold text-slate-800 mb-2">
            Composición por tipo de inversión
          </h3>
          <p className="text-[11px] text-slate-500 mb-3">
            Etiquetas con &quot;flujo&quot; indican tipos marcados como que generan ingreso periódico.
          </p>
          {pieData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={piePalette[i % piePalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => fmt(v)}
                    contentStyle={tooltipContentStyle}
                  />
                  <Legend wrapperStyle={{ ...legendStyle, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Sin datos de composición.</p>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-200/60">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Valor estimado agregado (histórico reconstruido)
          </h3>
          <p className="text-[11px] text-slate-500 mb-3">
            Serie a partir de eventos; el tramo inicial es el valor implícito antes del primer movimiento.
          </p>
          {historyData.length > 1 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historyData} margin={chartMargins.compact}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={CHART_PALETTE.gridMuted}
                  />
                  <XAxis
                    dataKey="date"
                    tick={tickSm}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(d) => (typeof d === 'string' ? d.slice(2) : d)}
                  />
                  <YAxis
                    tick={tickSm}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => yTick(Number(v))}
                  />
                  <Tooltip
                    formatter={(v: unknown) => fmt(v)}
                    labelFormatter={(l) => String(l)}
                    contentStyle={tooltipContentStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={CHART_PALETTE.income}
                    fill={CHART_PALETTE.incomeMuted}
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-slate-500">
              Añade eventos o más posiciones para ver evolución en el tiempo.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 border border-slate-200/60">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Flujo de utilidades (mensual)</h3>
          <p className="text-[11px] text-slate-500 mb-3">Últimos 24 meses con movimientos registrados.</p>
          {flowMonthly.some((r) => r.retiradas > 0 || r.reinvertidas > 0) ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowMonthly} margin={chartMargins.compact}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={CHART_PALETTE.gridMuted}
                  />
                  <XAxis dataKey="month" tick={tickSm} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={tickSm}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => yTick(Number(v))}
                  />
                  <Tooltip formatter={(v: unknown) => fmt(v)} contentStyle={tooltipContentStyle} />
                  <Legend wrapperStyle={{ ...legendStyle, fontSize: 11 }} />
                  <Bar
                    dataKey="retiradas"
                    name="Retiradas"
                    fill={CHART_PALETTE.simScenario}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="reinvertidas"
                    name="Reinvertidas"
                    fill={CHART_PALETTE.positive}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500 h-24 flex items-center">
              No hay distribuciones ni reinversiones en el período.
            </p>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-200/60">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Aportes vs retiros de capital (mensual)</h3>
          <p className="text-[11px] text-slate-500 mb-3">
            Contribuciones iniciales y aportes vs retiros y ventas parciales/totales.
          </p>
          {capitalMonthly.some((r) => r.aportes > 0 || r.retiros > 0) ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capitalMonthly} margin={chartMargins.compact}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={CHART_PALETTE.gridMuted}
                  />
                  <XAxis dataKey="month" tick={tickSm} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={tickSm}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => yTick(Number(v))}
                  />
                  <Tooltip formatter={(v: unknown) => fmt(v)} contentStyle={tooltipContentStyle} />
                  <Legend wrapperStyle={{ ...legendStyle, fontSize: 11 }} />
                  <Bar
                    dataKey="aportes"
                    name="Aportes"
                    fill={CHART_PALETTE.fiscalNet}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="retiros"
                    name="Retiros"
                    fill={CHART_PALETTE.fiscalBase}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500 h-24 flex items-center">
              No hay aportes ni retiros registrados en el período.
            </p>
          )}
        </div>
      </div>

      {linkedDebts.length > 0 && (
        <div className="glass-card rounded-xl p-4 border border-slate-200/60">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Deuda asociada al activo</h3>
          <p className="text-[11px] text-slate-500 mb-3">
            Deudas vinculadas a la posición frente al valor estimado del activo (apalancamiento orientativo).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3">Activo</th>
                  <th className="py-2 pr-3">Deuda</th>
                  <th className="py-2 pr-3 tabular-nums">Saldo</th>
                  <th className="py-2 pr-3 tabular-nums">Valor posición</th>
                  <th className="py-2 tabular-nums">Deuda / valor</th>
                </tr>
              </thead>
              <tbody>
                {linkedDebts.map((row) => (
                  <tr key={row.debtId} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-medium text-slate-800">{row.positionName}</td>
                    <td className="py-2 pr-3 text-slate-700">{row.debtName}</td>
                    <td className="py-2 pr-3 tabular-nums">{fmt(row.remainingAmount)}</td>
                    <td className="py-2 pr-3 tabular-nums">{fmt(row.positionEstimatedValue)}</td>
                    <td className="py-2 tabular-nums text-slate-700">
                      {row.debtToValueRatio != null
                        ? `${(row.debtToValueRatio * 100).toFixed(0)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <details className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-800 list-none [&::-webkit-details-marker]:hidden flex items-center gap-2">
          Metodología y límites
        </summary>
        <ul className="mt-2 space-y-2 list-disc pl-5 text-[12px] leading-relaxed">
          {disclaimers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
