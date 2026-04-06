import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatPresentedAmount } from '@/features/currency/format';
import {
  CHART_PALETTE,
  chartMargins,
  axisTickProps,
  legendStyle,
  tooltipContentStyle,
} from '@/shared/charts';

interface PositionChartsProps {
  pieData: any[];
  positions: any[];
  barChartData?: { name: string; capital: number; valor: number }[];
  chartCurrency?: string;
}

export function PositionCharts({
  pieData,
  positions,
  barChartData,
  chartCurrency = 'USD',
}: PositionChartsProps) {
  if (pieData.length === 0) return null;

  const bars =
    barChartData && barChartData.length > 0
      ? barChartData
      : positions.map((p) => ({
          name: p.name,
          capital: Number(p.initialCapital),
          valor: Number(p.currentEstimatedValue),
        }));

  const fmt = (v: unknown) =>
    formatPresentedAmount(Number(v ?? 0), chartCurrency);
  const yTick = (val: number) =>
    chartCurrency === 'USD' ? `$${val / 1000}k` : `${(val / 1e6).toFixed(1)}M`;

  const seriesColors = [...CHART_PALETTE.series];

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="chart-surface rounded-2xl border border-slate-200/90 p-3 shadow-sm sm:p-4">
        <h3 className="mb-3 text-sm font-semibold tracking-tight text-slate-900">Composición</h3>
        <div className="h-40 sm:h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius="38%"
                outerRadius="58%"
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((_: unknown, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={seriesColors[index % seriesColors.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: unknown) => fmt(value)} contentStyle={tooltipContentStyle} />
              <Legend wrapperStyle={{ ...legendStyle, fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-surface rounded-2xl border border-slate-200/90 p-3 shadow-sm sm:p-4">
        <h3 className="mb-3 text-sm font-semibold tracking-tight text-slate-900">
          Capital vs valor estimado
        </h3>
        <div className="h-40 sm:h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={chartMargins.compact}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={CHART_PALETTE.gridMuted}
              />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTickProps} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={axisTickProps}
                tickFormatter={(val) => yTick(val)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(248, 250, 252, 0.95)' }}
                formatter={(value: unknown) => fmt(value)}
                contentStyle={tooltipContentStyle}
              />
              <Legend wrapperStyle={{ ...legendStyle, fontSize: 10 }} />
              <Bar
                dataKey="capital"
                name="Aportado"
                fill={CHART_PALETTE.neutral}
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
              <Bar
                dataKey="valor"
                name="Estimado"
                fill={CHART_PALETTE.positive}
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
