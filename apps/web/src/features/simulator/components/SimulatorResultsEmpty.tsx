import { Sparkles } from 'lucide-react';

export function SimulatorResultsEmpty() {
  return (
    <div className="glass-card border-dashed border-slate-300 p-8 rounded-lg text-center text-slate-500 flex flex-col items-center gap-1.5 h-full justify-center">
      <Sparkles className="w-6 h-6 text-slate-300" />
      <div>
        <p className="font-bold text-xs text-slate-700">El futuro no está escrito</p>
        <p className="text-[9px] mt-0.5 max-w-sm mx-auto leading-relaxed">
          Ingresa los datos de tu escenario hipotético en el panel izquierdo para simular su impacto a largo plazo.
        </p>
      </div>
    </div>
  );
}
