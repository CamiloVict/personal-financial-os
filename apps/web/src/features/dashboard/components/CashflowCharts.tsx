import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { formatPresentedAmount } from '@/features/currency/format';
import {
  ChartCard,
  CHART_PALETTE,
  chartMargins,
  axisTickProps,
  tooltipContentStyle,
} from '@/shared/charts';

interface CashflowChartsProps {
  isLoading: boolean;
  analytics: any;
  expenseChartData?: { name: string; value: number }[];
  incomeChartData?: { name: string; value: number }[];
  chartCurrency?: string;
  presentationLoading?: boolean;
  /** Por defecto ocupa 4 columnas en `lg:grid-cols-12`; en dashboard se puede ampliar. */
  gridClassName?: string;
}

export function CashflowCharts({
  isLoading,
  analytics,
  expenseChartData,
  incomeChartData,
  chartCurrency = 'USD',
  presentationLoading,
  gridClassName = 'lg:col-span-4 flex flex-col gap-4',
}: CashflowChartsProps) {
  const expenses =
    expenseChartData && expenseChartData.length > 0
      ? expenseChartData
      : analytics?.expenses ?? [];
  const income =
    incomeChartData && incomeChartData.length > 0
      ? incomeChartData
      : analytics?.income ?? [];

  const fmt = (v: unknown) =>
    formatPresentedAmount(Number(v ?? 0), chartCurrency);
  const yTick = (val: number) =>
    chartCurrency === 'USD' ? `$${val / 1000}k` : `${(val / 1e6).toFixed(1)}M`;

  const expenseColors = [...CHART_PALETTE.expense];

  return (
    <div className={gridClassName}>
      <div className="flex justify-end">
        <ConfidenceBadge confidence={analytics?.confidence} />
      </div>

      <ChartCard
        title="Distribución de gastos"
        description="Por categoría (montos esperados del stream)."
        isLoading={isLoading}
        presentationLoading={presentationLoading}
        isEmpty={expenses.length === 0}
        emptyTitle="Sin gastos modelados"
        emptyDescription="Añade streams de gasto en Cashflow para ver la distribución."
        chartClassName="h-32 sm:h-36"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenses}
              innerRadius="32%"
              outerRadius="48%"
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
            >
              {expenses.map((_: unknown, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={expenseColors[index % expenseColors.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: unknown) => fmt(value)} contentStyle={tooltipContentStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Composición de ingresos"
        description="Fijo vs variable según tus streams."
        isLoading={isLoading}
        presentationLoading={presentationLoading}
        isEmpty={income.length === 0}
        emptyTitle="Sin ingresos modelados"
        emptyDescription="Registra ingresos en Cashflow para ver barras por tipo."
        chartClassName="h-32 sm:h-36"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={income} margin={chartMargins.compact}>
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
              cursor={{ fill: 'rgba(248, 250, 252, 0.9)' }}
              formatter={(value: unknown) => fmt(value)}
              contentStyle={tooltipContentStyle}
            />
            <Bar
              dataKey="value"
              fill={CHART_PALETTE.income}
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
