import { Sparkles } from 'lucide-react';

export function SimulatorResultsEmpty() {
  return (
    <div className="glass-card border-dashed border-slate-300 p-8 rounded-lg text-center text-slate-500 flex flex-col items-center gap-1.5 h-full justify-center">
      <Sparkles className="w-6 h-6 text-slate-300" />
      <div>
        <p className="font-bold text-xs text-slate-700">El futuro no está escrito</p>
        <p className="text-[9px] mt-0.5 max-w-sm mx-auto leading-relaxed">
          Completá el formulario y pulsá simular: verás la <strong className="font-medium text-slate-600">línea base</strong>{' '}
          frente al <strong className="font-medium text-slate-600">escenario</strong> y el delta de patrimonio.
        </p>
      </div>
    </div>
  );
}
