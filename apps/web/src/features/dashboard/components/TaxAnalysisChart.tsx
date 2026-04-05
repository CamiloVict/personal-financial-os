import React from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TaxAnalysisChartProps {
  isLoading: boolean;
  analytics: any;
}

export function TaxAnalysisChart({ isLoading, analytics }: TaxAnalysisChartProps) {
  return (
    <div className="glass-card rounded-xl p-4 flex-1">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold text-slate-800">Comparativa Fiscal (Escenarios)</h3>
        <Link href="/tax" className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded">Ver plan</Link>
      </div>
      {isLoading ? (
          <div className="h-40 flex justify-center items-center"><Activity className="w-4 h-4 animate-spin text-slate-400" /></div>
      ) : analytics?.scenariosComparison?.length > 0 ? (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.scenariosComparison} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9}} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
              <Legend wrapperStyle={{fontSize: '9px', paddingTop: '2px'}} />
              <Bar dataKey="taxableBase" name="Base" fill="#94a3b8" radius={[2, 2, 0, 0]} maxBarSize={15} />
              <Bar dataKey="taxLiability" name="Imp. Bruto" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={15} />
              <Bar dataKey="netTaxPayable" name="Imp. Neto" fill="#6366f1" radius={[2, 2, 0, 0]} maxBarSize={15} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-40 flex justify-center items-center text-slate-500 border border-dashed rounded-lg text-[10px] px-6 text-center">
          No has generado simulaciones fiscales.
        </div>
      )}
    </div>
  );
}