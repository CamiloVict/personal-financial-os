import React from 'react';
import { Activity } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const EXPENSE_COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca'];

interface CashflowChartsProps {
  isLoading: boolean;
  analytics: any;
}

export function CashflowCharts({ isLoading, analytics }: CashflowChartsProps) {
  return (
    <div className="lg:col-span-4 flex flex-col gap-4">
      <div className="glass-card rounded-xl p-3">
        <h3 className="text-xs font-bold text-slate-800 mb-2">Distribución de Gastos</h3>
        {isLoading ? (
          <div className="h-32 flex justify-center items-center"><Activity className="w-4 h-4 animate-spin text-slate-400" /></div>
        ) : analytics?.expenses?.length > 0 ? (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.expenses} innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value" nameKey="name">
                  {analytics.expenses.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex justify-center items-center text-slate-400/50 border border-dashed rounded-lg text-[10px]">Sin datos</div>
        )}
      </div>

      <div className="glass-card rounded-xl p-3">
        <h3 className="text-xs font-bold text-slate-800 mb-2">Composición de Ingresos</h3>
        {isLoading ? (
          <div className="h-32 flex justify-center items-center"><Activity className="w-4 h-4 animate-spin text-slate-400" /></div>
        ) : analytics?.income?.length > 0 ? (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.income} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9}} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="value" fill="#2563eb" radius={[2, 2, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex justify-center items-center text-slate-400/50 border border-dashed rounded-lg text-[10px]">Sin datos</div>
        )}
      </div>
    </div>
  );
}