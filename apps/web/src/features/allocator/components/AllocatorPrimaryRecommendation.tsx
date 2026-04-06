import type { AllocatorPlan } from '../types';

/** Mayor `priorityScore` del backend como “recomendación principal” legible. */
export function AllocatorPrimaryRecommendation({ plan }: { plan: AllocatorPlan }) {
  if (!plan.scenarios.length) return null;
  const top = [...plan.scenarios].sort((a, b) => b.priorityScore - a.priorityScore)[0];
  return (
    <div className="rounded-xl border border-fuchsia-200/90 bg-gradient-to-br from-fuchsia-50/90 to-white p-3 shadow-sm">
      <p className="text-[9px] font-bold uppercase tracking-wider text-fuchsia-800 mb-1">
        Recomendación principal (orden del modelo)
      </p>
      <p className="text-sm font-bold text-slate-900 leading-snug">{top.title}</p>
      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{top.description}</p>
      <p className="text-[10px] text-slate-500 mt-2">
        El resto de tarjetas son usos alternativos o complementarios según prioridades implícitas (deuda, fiscal,
        liquidez). <strong className="font-medium text-slate-600">No</strong> sustituye asesoría personalizada.
      </p>
    </div>
  );
}
