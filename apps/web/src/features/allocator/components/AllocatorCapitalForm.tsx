import { Activity, Zap } from 'lucide-react';

interface AllocatorCapitalFormProps {
  availableCapital: string;
  onCapitalChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  /** Moneda del campo: alineada con la barra global (COP salvo vista USD). */
  inputCurrency: 'USD' | 'COP';
  helpText: string;
  errorMessage?: string | null;
}

export function AllocatorCapitalForm({
  availableCapital,
  onCapitalChange,
  onSubmit,
  isPending,
  inputCurrency,
  helpText,
  errorMessage,
}: AllocatorCapitalFormProps) {
  const ccyLabel = inputCurrency === 'USD' ? 'USD' : 'COP';
  return (
    <div className="glass-card max-w-2xl mx-auto rounded-xl p-4 md:p-5 shadow-sm">
      <div className="text-center mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-1">
          ¿Cuánto capital querés repartir?
        </h2>
        <p className="text-[10px] text-slate-500">
          Un solo número para esta corrida, en <strong className="font-medium text-slate-700">{ccyLabel}</strong> según
          tu modo de valuación global. Podés probar varios montos; no mueve tu dinero real.
        </p>
        <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed max-w-lg mx-auto">{helpText}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="relative max-w-md mx-auto flex items-stretch gap-2">
          <span
            className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-2 text-[10px] font-black text-slate-600 min-w-11"
            title={`Entrada en ${ccyLabel}`}
          >
            {ccyLabel}
          </span>
          <input
            type="number"
            required
            min={0}
            step={inputCurrency === 'USD' ? '0.01' : '1'}
            value={availableCapital}
            onChange={(e) => onCapitalChange(e.target.value)}
            className="glass-input flex-1 min-w-0 p-2 rounded-lg text-sm font-bold text-slate-800 shadow-sm text-center"
            placeholder={inputCurrency === 'USD' ? '10000' : '50000000'}
          />
        </div>
        {errorMessage ? (
          <p className="text-center text-[10px] font-medium text-rose-600 max-w-md mx-auto">{errorMessage}</p>
        ) : null}

        <div className="flex justify-center pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-sm text-xs disabled:opacity-60"
          >
            {isPending ? (
              <Activity className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            {isPending ? 'Simulando…' : 'Simular escenarios'}
          </button>
        </div>
      </form>
    </div>
  );
}
