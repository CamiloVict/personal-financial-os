import { ShieldAlert } from 'lucide-react';

export function AllocatorScenariosEmpty() {
  return (
    <div className="glass-card border-dashed border-slate-300 p-8 rounded-lg text-center text-slate-500 flex flex-col items-center gap-2">
      <ShieldAlert className="w-8 h-8 text-slate-300" />
      <p className="font-semibold text-sm">No se generaron escenarios con los datos actuales.</p>
      <p className="text-[10px] max-w-xs leading-relaxed">
        Si completas perfil fiscal, metas o deudas en la app, el modelo podrá armar más filas de simulación.
      </p>
    </div>
  );
}
