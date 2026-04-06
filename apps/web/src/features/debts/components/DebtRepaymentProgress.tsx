import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { formatBookAmount } from '@/features/currency/format';

interface DebtRepaymentProgressProps {
  debtId: string;
  totalAmount: number;
  remainingAmount: number;
  currency: string;
  monthlyPayment?: number;
  interestRate?: number;
  autoApplyMonthlyPayment?: boolean;
  lastAutoPaymentMonth?: string | null;
  lastAutoInterestPortion?: number | null;
  lastAutoPrincipalPortion?: number | null;
  onToggleAutoApply?: (id: string, next: boolean) => void;
  onSaveTerms?: (
    id: string,
    body: { monthlyPayment: number; interestRate: number },
  ) => void;
  patchPending?: boolean;
}

export function DebtRepaymentProgress({
  debtId,
  totalAmount,
  remainingAmount,
  currency,
  monthlyPayment = 0,
  interestRate = 0,
  autoApplyMonthlyPayment = false,
  lastAutoPaymentMonth,
  lastAutoInterestPortion,
  lastAutoPrincipalPortion,
  onToggleAutoApply,
  onSaveTerms,
  patchPending,
}: DebtRepaymentProgressProps) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [localMp, setLocalMp] = useState('');
  const [localRate, setLocalRate] = useState('');

  useEffect(() => {
    setLocalMp(monthlyPayment > 0 ? String(monthlyPayment) : '');
    setLocalRate(
      interestRate !== undefined && Number.isFinite(interestRate)
        ? String(interestRate)
        : '0',
    );
  }, [debtId, monthlyPayment, interestRate]);

  const paidPct =
    totalAmount > 0
      ? Math.min(100, Math.max(0, ((totalAmount - remainingAmount) / totalAmount) * 100))
      : 0;

  const hasLastSplit =
    Boolean(lastAutoPaymentMonth) &&
    (lastAutoInterestPortion != null || lastAutoPrincipalPortion != null);

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
        {interestRate > 0 ? (
          <> · Tasa: {Number(interestRate).toFixed(2)}% nominal anual</>
        ) : null}
      </p>
      {hasLastSplit ? (
        <p className="text-[9px] text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5 leading-relaxed">
          <span className="font-semibold text-slate-700">
            Última aplicación ({lastAutoPaymentMonth}):
          </span>{' '}
          {formatBookAmount(Number(lastAutoInterestPortion ?? 0), currency)} intereses ·{' '}
          {formatBookAmount(Number(lastAutoPrincipalPortion ?? 0), currency)} capital. El saldo solo
          baja por la parte de capital.
        </p>
      ) : null}
      <p className="text-[9px] text-slate-500 leading-relaxed">
        Con amortización automática activa, cada mes se calcula: interés = saldo × (tasa nominal
        anual ÷ 12); el resto de la cuota reduce el capital pendiente (crédito vehículo, banco,
        hipoteca, etc.).
      </p>
      {onSaveTerms ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setTermsOpen((o) => !o)}
            className="w-full flex items-center gap-1.5 text-left text-[10px] font-semibold text-slate-700 bg-slate-50/90 px-2 py-1.5 hover:bg-slate-100/90"
          >
            {termsOpen ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            )}
            Cuota mensual y tasa anual
          </button>
          {termsOpen ? (
            <div className="p-2 space-y-2 bg-white">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                    Cuota / mes
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={localMp}
                    onChange={(e) => setLocalMp(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                    Tasa % anual (nominal)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={localRate}
                    onChange={(e) => setLocalRate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md px-2 py-1"
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={patchPending}
                onClick={() =>
                  onSaveTerms(debtId, {
                    monthlyPayment: Number(localMp) || 0,
                    interestRate: Number(localRate) || 0,
                  })
                }
                className="text-[10px] font-semibold bg-slate-800 text-white rounded-md px-2 py-1 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
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
            Aplicar cuota automática cada mes (interés + capital según tasa y saldo)
          </span>
        </label>
      ) : null}
    </div>
  );
}
