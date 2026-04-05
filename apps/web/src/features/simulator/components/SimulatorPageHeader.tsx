import { Sparkles } from 'lucide-react';

export function SimulatorPageHeader() {
  return (
    <header className="flex justify-between items-end border-b border-slate-200/50 pb-2 mb-2">
      <div>
        <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
          <div className="p-1 bg-amber-100 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          La Máquina del Tiempo Financiera
        </h1>
        <p className="text-slate-500 mt-1 text-[10px] leading-relaxed max-w-3xl">
          Simula escenarios hipotéticos y descubre su impacto real a largo plazo.
        </p>
      </div>
    </header>
  );
}
