import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CashflowMetricsProps {
  totalExpectedIncome: number;
  totalExpectedExpense: number;
  remainingExpected: number;
  incomeStreamsCount: number;
  expenseStreamsCount: number;
}

export function CashflowMetrics({ 
  totalExpectedIncome, 
  totalExpectedExpense, 
  remainingExpected,
  incomeStreamsCount,
  expenseStreamsCount
}: CashflowMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="glass-card rounded-xl p-4 border-l-4 border-l-emerald-500 bg-white">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Ingreso Proyectado
        </p>
        <p className="text-xl font-bold text-slate-800 tracking-tight">${totalExpectedIncome.toLocaleString()}</p>
      </div>
      <div className="glass-card rounded-xl p-4 border-l-4 border-l-rose-500 bg-white">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Gasto Proyectado
        </p>
        <p className="text-xl font-bold text-slate-800 tracking-tight">${totalExpectedExpense.toLocaleString()}</p>
      </div>
      <div className={`glass-card rounded-xl p-4 border-l-4 bg-white ${remainingExpected >= 0 ? 'border-l-blue-500' : 'border-l-amber-500'}`}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Flujo Libre</p>
        <p className="text-xl font-bold text-slate-800 tracking-tight">${remainingExpected.toLocaleString()}</p>
      </div>
    </div>
  );
}