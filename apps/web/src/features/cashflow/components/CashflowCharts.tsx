import React from 'react';
import { Activity } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { formatPresentedAmount } from '@/features/currency/format';

const EXPENSE_COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca'];

interface CashflowChartsProps {
  isLoadingAnalytics: boolean;
  cashflowAnalytics: any;
  /** Reemplaza agregados del API cuando hay valuación multi-moneda */
  expenseChartData?: { name: string; value: number }[];
  incomeChartData?: { name: string; value: number }[];
  chartCurrency?: string;
  presentationLoading?: boolean;
}

export function CashflowCharts({
  isLoadingAnalytics,
  cashflowAnalytics,
  expenseChartData,
  incomeChartData,
  chartCurrency = 'USD',
  presentationLoading,
}: CashflowChartsProps) {
  const expenses =
    expenseChartData && expenseChartData.length > 0
      ? expenseChartData
      : cashflowAnalytics?.expenses ?? [];
  const income =
    incomeChartData && incomeChartData.length > 0
      ? incomeChartData
      : cashflowAnalytics?.income ?? [];

  const fmt = (v: unknown) =>
    formatPresentedAmount(Number(v ?? 0), chartCurrency);
  const yTick = (val: number) =>
    chartCurrency === 'USD' ? `$${val / 1000}k` : `${(val / 1e6).toFixed(1)}M`;
  return (
    <div className="space-y-3 mb-4">
      <div className="flex justify-end">
        <ConfidenceBadge confidence={cashflowAnalytics?.confidence} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4">Distribución de Gastos por Categoría</h3>
        {isLoadingAnalytics ? (
          <div className="h-48 flex justify-center items-center"><Activity className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : presentationLoading ? (
          <div className="h-48 flex justify-center items-center">
            <Activity className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : expenses.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenses}
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {expenses.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => fmt(value)} />
                <Legend wrapperStyle={{fontSize: '10px', color: '#64748b'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex justify-center items-center text-slate-400/50 border border-dashed border-slate-300/50 rounded-xl text-xs">No hay datos suficientes de gastos</div>
        )}
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4">Composición de Ingresos (Fijos vs Variables)</h3>
        {isLoadingAnalytics ? (
          <div className="h-48 flex justify-center items-center"><Activity className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : presentationLoading ? (
          <div className="h-48 flex justify-center items-center">
            <Activity className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : income.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={income}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => yTick(val)}
                />
                <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.4 }} formatter={(value: any) => fmt(value)} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex justify-center items-center text-slate-400/50 border border-dashed border-slate-300/50 rounded-xl text-xs">No hay datos suficientes de ingresos</div>
        )}
      </div>
      </div>
    </div>
  );
}