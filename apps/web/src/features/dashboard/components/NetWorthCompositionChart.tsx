'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatPresentedAmount } from '@/features/currency/format';
import { ChartCard } from '@/shared/charts/ChartCard';
import { CHART_PALETTE, legendStyle, tooltipContentStyle } from '@/shared/charts/chartTokens';

export function NetWorthCompositionChart({
  composition,
  chartCurrency,
}: {
  composition: { name: string; value: number }[];
  chartCurrency: string;
}) {
  const data = composition.filter((c) => c.value > 0);
  const fmt = (v: number) => formatPresentedAmount(v, chartCurrency);
  const palette = CHART_PALETTE.series;

  return (
    <ChartCard
      title="Composición patrimonial"
      description="Todas las posiciones activas por categoría. Los pasivos se gestionan en Deudas."
      chartClassName="h-52 min-h-[13rem] sm:h-56"
      isEmpty={data.length === 0}
      emptyTitle="Sin posiciones activas"
      emptyDescription="Agrega posiciones en Portafolio para ver la composición por categoría."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="72%"
            label={({ name, percent }) =>
              `${name} ${((percent as number) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => fmt(Number(v ?? 0))}
            contentStyle={tooltipContentStyle}
          />
          <Legend wrapperStyle={{ ...legendStyle, fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
