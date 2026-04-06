import React from 'react';
import { formatPresentedAmount } from '@/features/currency/format';

export function CashflowRollingStats({
  avgNet3,
  avgNet6,
  avgNet12,
  chartCurrency,
}: {
  avgNet3: number;
  avgNet6: number;
  avgNet12: number;
  chartCurrency: string;
}) {
  const fmt = (n: number) => formatPresentedAmount(n, chartCurrency);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[
        { label: 'Promedio neto (3 meses)', value: avgNet3, hint: 'Eventos' },
        { label: 'Promedio neto (6 meses)', value: avgNet6, hint: 'Eventos' },
        { label: 'Promedio neto (12 meses)', value: avgNet12, hint: 'Eventos' },
      ].map((x) => (
        <div
          key={x.label}
          className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-3 shadow-sm"
        >
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{x.label}</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums mt-1">{fmt(x.value)}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">{x.hint}</p>
        </div>
      ))}
    </div>
  );
}
