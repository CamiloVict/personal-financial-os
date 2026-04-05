import { Activity, Sparkles } from 'lucide-react';

interface SimulatorFormSubmitProps {
  isPending: boolean;
}

export function SimulatorFormSubmit({ isPending }: SimulatorFormSubmitProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded font-bold flex justify-center items-center gap-1.5 transition-all shadow-sm text-[10px]"
    >
      {isPending ? <Activity className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
      {isPending ? 'Simulando...' : 'Simular Impacto'}
    </button>
  );
}
