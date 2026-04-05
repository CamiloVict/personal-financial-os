import { Scale } from 'lucide-react';

export function DebtsEmptyTotal() {
  return (
    <div className="glass-card border-dashed border-slate-300 p-8 rounded-xl text-center text-slate-500 flex flex-col items-center gap-2">
      <Scale className="w-8 h-8 text-slate-300" />
      <div>
        <p className="font-bold text-sm text-slate-700">Libre de Deudas</p>
        <p className="text-[10px] mt-1">Actualmente no tienes ninguna deuda registrada en el sistema.</p>
      </div>
    </div>
  );
}
