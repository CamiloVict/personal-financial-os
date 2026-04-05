import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

interface PositionChartsProps {
  pieData: any[];
  positions: any[];
}

export function PositionCharts({ pieData, positions }: PositionChartsProps) {
  if (pieData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3 tracking-tight">Composición</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" nameKey="name">
                {pieData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
              <Legend wrapperStyle={{fontSize: '10px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3 tracking-tight">Rendimiento (Capital vs Valor)</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={positions.map(p => ({ name: p.name, capital: Number(p.initialCapital), valor: Number(p.currentEstimatedValue) }))} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9}} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
              <Legend wrapperStyle={{fontSize: '10px', paddingTop: '5px'}} />
              <Bar dataKey="capital" name="Aportado" fill="#94a3b8" radius={[2, 2, 0, 0]} maxBarSize={20} />
              <Bar dataKey="valor" name="Estimado" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}