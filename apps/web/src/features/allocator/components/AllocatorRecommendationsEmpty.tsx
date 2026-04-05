import { ShieldAlert } from 'lucide-react';

export function AllocatorRecommendationsEmpty() {
  return (
    <div className="glass-card border-dashed border-slate-300 p-8 rounded-lg text-center text-slate-500 flex flex-col items-center gap-2">
      <ShieldAlert className="w-8 h-8 text-slate-300" />
      <p className="font-semibold text-sm">No encontramos estrategias de alto retorno garantizado.</p>
      <p className="text-[10px] max-w-xs leading-relaxed">
        Revisa que tengas tu Perfil Fiscal actualizado, metas creadas o deudas registradas.
      </p>
    </div>
  );
}
