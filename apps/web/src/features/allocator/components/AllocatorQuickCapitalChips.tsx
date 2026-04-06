'use client';

const QUICK_AMOUNTS: { value: number; label: string }[] = [
  { value: 5_000_000, label: '5M' },
  { value: 15_000_000, label: '15M' },
  { value: 30_000_000, label: '30M' },
  { value: 75_000_000, label: '75M' },
];

interface AllocatorQuickCapitalChipsProps {
  onPick: (amount: number) => void;
  disabled?: boolean;
}

/**
 * Atajos de monto (misma unidad que el campo: típicamente COP en uso local).
 * Los “presets de estrategia” (deuda vs crecimiento) dependen del motor; esto solo acelera la entrada.
 */
export function AllocatorQuickCapitalChips({ onPick, disabled }: AllocatorQuickCapitalChipsProps) {
  return (
    <div className="max-w-2xl mx-auto mb-3">
      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide text-center mb-1.5">
        Montos rápidos (rellenan el campo)
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {QUICK_AMOUNTS.map(({ value, label }) => (
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
