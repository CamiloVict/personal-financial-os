import React from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { formatPresentedAmount } from '@/features/currency/format';
import { ChartCard } from '@/shared/charts/ChartCard';
import {
  CHART_PALETTE,
  axisTickProps,
  chartMargins,
  legendStyle,
  tooltipContentStyle,
} from '@/shared/charts/chartTokens';

export type TaxScenarioChartRow = {
  name: string;
  taxableBase: number;
  taxLiability: number;
  netTaxPayable: number;
};

interface TaxAnalysisChartProps {
  isLoading: boolean;
  analytics: any;
  /** Si viene, sustituye `analytics.scenariosComparison` (ya presentado con la barra global). */
  chartData?: TaxScenarioChartRow[];
  chartCurrency?: string;
  presentationLoading?: boolean;
}

export function TaxAnalysisChart({
  isLoading,
  analytics,
  chartData,
  chartCurrency = 'COP',
  presentationLoading,
}: TaxAnalysisChartProps) {
  const data =
    chartData && chartData.length > 0
      ? chartData
      : analytics?.scenariosComparison ?? [];

  const yTick = (val: number) =>
    chartCurrency === 'USD' ? `$${val / 1000}k` : `${(val / 1e6).toFixed(1)}M`;
  const tooltipFmt = (v: unknown) =>
    formatPresentedAmount(Number(v ?? 0), chartCurrency);

  const tickCompact = { ...axisTickProps, fontSize: 9 } as const;

  return (
    <ChartCard
      className="flex-1"
      title="Comparativa fiscal (escenarios)"
      description="Base gravable, impuesto bruto y neto por escenario."
      chartClassName="h-40"
      isLoading={isLoading}
      isEmpty={!isLoading && data.length === 0}
      emptyTitle="Sin simulaciones fiscales"
      emptyDescription="Genera escenarios en el plan fiscal para comparar montos aquí."
      headerRight={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ConfidenceBadge confidence={analytics?.confidence} />
          <Link
            href="/tax"
            className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Ver plan
          </Link>
        </div>
      }
    >
      <div className="relative h-full min-h-40">
        {presentationLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 text-[10px] font-medium text-slate-500 backdrop-blur-[1px]">
            Aplicando valuación…
          </div>
        ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargins.withLegend}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={CHART_PALETTE.gridMuted}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={tickCompact}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={tickCompact}
              tickFormatter={(val) => yTick(Number(val))}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={tooltipContentStyle}
              formatter={(value: unknown) => tooltipFmt(value)}
            />
            <Legend wrapperStyle={{ ...legendStyle, fontSize: 9, paddingTop: 2 }} />
            <Bar
              dataKey="taxableBase"
              name="Base"
              fill={CHART_PALETTE.fiscalBase}
              radius={[4, 4, 0, 0]}
              maxBarSize={15}
            />
            <Bar
              dataKey="taxLiability"
              name="Imp. bruto"
              fill={CHART_PALETTE.fiscalGross}
              radius={[4, 4, 0, 0]}
              maxBarSize={15}
            />
            <Bar
              dataKey="netTaxPayable"
              name="Imp. neto"
              fill={CHART_PALETTE.fiscalNet}
              radius={[4, 4, 0, 0]}
              maxBarSize={15}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
