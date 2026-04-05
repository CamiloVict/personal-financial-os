import React from 'react';
import { TrendingUp, DollarSign, Activity, AlertCircle } from 'lucide-react';

interface DashboardMetricsProps {
  totalInvested: number;
  totalEstimatedValue: number;
  totalReturn: number;
  returnPercentage: number;
}

export function DashboardMetrics({ totalInvested, totalEstimatedValue, totalReturn, returnPercentage }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div className="glass-card rounded-xl p-4">
        <div className="flex justify-between items-start">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Patrimonio Invertido</p>
          <div className="p-1 bg-blue-50 rounded-md"><DollarSign className="w-3 h-3 text-blue-600" /></div>
        </div>
        <p className="text-lg font-bold text-slate-900 tracking-tight mt-1.5">${totalInvested.toLocaleString()}</p>
      </div>
      
      <div className="glass-card rounded-xl p-3 border-b-[3px] border-b-indigo-500">
        <div className="flex justify-between items-start">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Valor Actual Est.</p>
          <div className="p-1 bg-indigo-50 rounded-md"><Activity className="w-3 h-3 text-indigo-600" /></div>
        </div>
        <p className="text-lg font-bold text-indigo-600 tracking-tight mt-1.5">${totalEstimatedValue.toLocaleString()}</p>
      </div>
      
      <div className="glass-card rounded-xl p-3">
        <div className="flex justify-between items-start">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Retorno ($)</p>
          <div className={`p-1 rounded-md ${totalReturn >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            {totalReturn >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-rose-600" />}
          </div>
        </div>
        <p className={`text-lg font-bold tracking-tight mt-1.5 ${totalReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {totalReturn >= 0 ? '+' : '-'}${Math.abs(totalReturn).toLocaleString()}
        </p>
      </div>

      <div className="glass-card rounded-xl p-3">
        <div className="flex justify-between items-start">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">ROI (%)</p>
          <div className={`p-1 rounded-md ${returnPercentage >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <TrendingUp className={`w-3 h-3 ${returnPercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
        </div>
        <p className={`text-lg font-bold tracking-tight mt-1.5 ${returnPercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}