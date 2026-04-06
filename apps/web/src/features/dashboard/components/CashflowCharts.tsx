import React from 'react';
import { Activity } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { formatPresentedAmount } from '@/features/currency/format';

const EXPENSE_COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca'];

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

  return (
    <div className={gridClassName}>
      <div className="flex justify-end">
        <ConfidenceBadge confidence={analytics?.confidence} />
      </div>
      <div className="glass-card rounded-xl p-3">
        <h3 className="text-xs font-bold text-slate-800 mb-2">Distribución de Gastos</h3>
        {isLoading ? (
          <div className="h-32 flex justify-center items-center">
            <Activity className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        ) : presentationLoading ? (
          <div className="h-32 flex justify-center items-center">
            <Activity className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        ) : expenses.length > 0 ? (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenses}
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {expenses.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => fmt(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex justify-center items-center text-slate-400/50 border border-dashed rounded-lg text-[10px]">
            Sin datos
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-3">
        <h3 className="text-xs font-bold text-slate-800 mb-2">Composición de Ingresos</h3>
        {isLoading ? (
          <div className="h-32 flex justify-center items-center">
            <Activity className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        ) : presentationLoading ? (
          <div className="h-32 flex justify-center items-center">
            <Activity className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        ) : income.length > 0 ? (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={income} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 9 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  tickFormatter={(val) => yTick(val)}
                />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value: unknown) => fmt(value)} />
                <Bar dataKey="value" fill="#2563eb" radius={[2, 2, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex justify-center items-center text-slate-400/50 border border-dashed rounded-lg text-[10px]">
            Sin datos
          </div>
        )}
      </div>
    </div>
  );
}
