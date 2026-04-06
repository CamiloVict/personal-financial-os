import { Activity, Zap } from 'lucide-react';

interface AllocatorCapitalFormProps {
  availableCapital: string;
  onCapitalChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function AllocatorCapitalForm({
  availableCapital,
  onCapitalChange,
  onSubmit,
  isPending,
}: AllocatorCapitalFormProps) {
  return (
    <div className="glass-card max-w-2xl mx-auto rounded-xl p-4 md:p-5 shadow-sm">
      <div className="text-center mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-1">
          ¿Cuánto capital querés repartir?
        </h2>
        <p className="text-[10px] text-slate-500">
          Un solo número para esta corrida. Podés probar varios montos y comparar distribuciones sugeridas; no
          mueve tu dinero real.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="relative max-w-xs mx-auto">
          <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
          <input
            type="number"
            required
            value={availableCapital}
            onChange={(e) => onCapitalChange(e.target.value)}
            className="glass-input w-full p-2 pl-7 rounded-lg text-sm font-bold text-slate-800 shadow-sm text-center"
            placeholder="0.00"
          />
        </div>

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
