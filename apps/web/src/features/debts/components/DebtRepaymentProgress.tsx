import React from 'react';
import { formatBookAmount } from '@/features/currency/format';

interface DebtRepaymentProgressProps {
  debtId: string;
  totalAmount: number;
  remainingAmount: number;
  currency: string;
  monthlyPayment?: number;
  autoApplyMonthlyPayment?: boolean;
  onToggleAutoApply?: (id: string, next: boolean) => void;
  patchPending?: boolean;
}

export function DebtRepaymentProgress({
  debtId,
  totalAmount,
  remainingAmount,
  currency,
  monthlyPayment = 0,
  autoApplyMonthlyPayment = false,
  onToggleAutoApply,
  patchPending,
}: DebtRepaymentProgressProps) {
  const paidPct =
    totalAmount > 0
      ? Math.min(100, Math.max(0, ((totalAmount - remainingAmount) / totalAmount) * 100))
      : 0;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold tracking-wider">
        <span>Progreso de amortización</span>
        <span>{paidPct.toFixed(0)}% pagado</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
          style={{ width: `${paidPct}%` }}
        />
      </div>
      <p className="text-[9px] text-slate-400">
        Original: {formatBookAmount(Number(totalAmount), currency)} · Pendiente:{' '}
        {formatBookAmount(Number(remainingAmount), currency)}
        {monthlyPayment > 0 ? (
          <>
            {' '}
            · Cuota: {formatBookAmount(Number(monthlyPayment), currency)}/mes
          </>
        ) : null}
      </p>
      {monthlyPayment > 0 && onToggleAutoApply ? (
        <label className="flex items-center gap-2 text-[10px] text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded border-slate-300"
            checked={autoApplyMonthlyPayment}
            disabled={patchPending}
            onChange={(e) => onToggleAutoApply(debtId, e.target.checked)}
          />
          <span>
            Descontar cuota fija automáticamente cada mes (sin registro manual)
          </span>
        </label>
      ) : null}
    </div>
  );
}
