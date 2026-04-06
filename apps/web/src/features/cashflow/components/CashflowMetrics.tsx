import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatPresentedAmount } from '@/features/currency/format';

interface CashflowMetricsProps {
  totalExpectedIncome: number;
  totalExpectedExpense: number;
  remainingExpected: number;
  incomeStreamsCount: number;
  expenseStreamsCount: number;
  /** Si hay valuación multi-moneda coherente */
  presentedIncome?: number | null;
  presentedExpense?: number | null;
  presentedRemaining?: number | null;
  presentedCurrency?: string;
  presentationLoading?: boolean;
  presentationLabel?: string;
}

export function CashflowMetrics({
  totalExpectedIncome,
  totalExpectedExpense,
  remainingExpected,
  incomeStreamsCount,
  expenseStreamsCount,
  presentedIncome,
  presentedExpense,
  presentedRemaining,
  presentedCurrency = 'COP',
  presentationLoading,
  presentationLabel,
}: CashflowMetricsProps) {
  const usePres =
    presentedIncome != null &&
    presentedExpense != null &&
    presentedRemaining != null &&
    !presentationLoading;

  const fmt = (n: number) =>
    usePres
      ? formatPresentedAmount(n, presentedCurrency)
      : n.toLocaleString('es-CO', { maximumFractionDigits: 0 });

  const inc = usePres ? presentedIncome! : totalExpectedIncome;
  const exp = usePres ? presentedExpense! : totalExpectedExpense;
  const rem = usePres ? presentedRemaining! : remainingExpected;

  return (
    <div className="space-y-2 mb-4">
      {presentationLabel ? (
        <p className="text-[10px] text-slate-500 font-medium">{presentationLabel}</p>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-emerald-500 bg-white">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Ingreso Proyectado
          </p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">
            {presentationLoading ? '…' : fmt(inc)}
          </p>
          {usePres ? (
            <p className="text-[9px] text-slate-400 mt-1">
              Suma nominal en libro:{' '}
              {totalExpectedIncome.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </p>
          ) : null}
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-rose-500 bg-white">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Gasto Proyectado
          </p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">
            {presentationLoading ? '…' : fmt(exp)}
          </p>
          {usePres ? (
            <p className="text-[9px] text-slate-400 mt-1">
              Suma nominal en libro:{' '}
              {totalExpectedExpense.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </p>
          ) : null}
        </div>
        <div
          className={`glass-card rounded-xl p-4 border-l-4 bg-white ${rem >= 0 ? 'border-l-blue-500' : 'border-l-amber-500'}`}
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Flujo Libre
          </p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">
            {presentationLoading ? '…' : fmt(rem)}
          </p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400">
        {incomeStreamsCount} ingreso(s) · {expenseStreamsCount} gasto(s)
      </p>
    </div>
  );
}
