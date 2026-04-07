'use client';

const QUICK_COP: { value: number; label: string }[] = [
  { value: 5_000_000, label: '5M COP' },
  { value: 15_000_000, label: '15M COP' },
  { value: 30_000_000, label: '30M COP' },
  { value: 75_000_000, label: '75M COP' },
];

const QUICK_USD: { value: number; label: string }[] = [
  { value: 2_500, label: 'US$2.5k' },
  { value: 10_000, label: 'US$10k' },
  { value: 25_000, label: 'US$25k' },
  { value: 50_000, label: 'US$50k' },
];

interface AllocatorQuickCapitalChipsProps {
  onPick: (amount: number) => void;
  disabled?: boolean;
  inputCurrency: 'USD' | 'COP';
}

/**
 * Atajos de monto en la misma moneda que el campo (según barra global).
 */
export function AllocatorQuickCapitalChips({
  onPick,
  disabled,
  inputCurrency,
}: AllocatorQuickCapitalChipsProps) {
  const amounts = inputCurrency === 'USD' ? QUICK_USD : QUICK_COP;
  return (
    <div className="max-w-2xl mx-auto mb-3">
      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide text-center mb-1.5">
        Montos rápidos ({inputCurrency}) — rellenan el campo
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {amounts.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onPick(value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm transition-colors hover:border-fuchsia-300 hover:bg-fuchsia-50/60 disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
