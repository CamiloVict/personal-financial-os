import Link from 'next/link';
import { Network, Sparkles } from 'lucide-react';

/**
 * Superficie de descubrimiento para Planificación (Etapa 3):
 * enlaza Asignación y Simulador sin duplicar lógica de negocio.
 */
export function PlanningShortcuts() {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm">
      <h3 className="text-xs font-bold text-slate-900 mb-0.5">Futuro · planificación</h3>
      <p className="text-[10px] text-slate-500 mb-3 leading-snug">
        Herramientas <strong className="font-medium text-slate-600">hipotéticas</strong>: probá escenarios sin tocar lo que ya registraste en{' '}
        <strong className="font-medium text-slate-600">Hoy</strong>.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/allocator"
          className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-200/80 bg-fuchsia-50/90 px-2.5 py-1.5 text-[10px] font-semibold text-fuchsia-800 transition-colors hover:bg-fuchsia-100"
        >
          <Network className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Asignación
        </Link>
        <Link
          href="/simulator"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-[10px] font-semibold text-amber-900 transition-colors hover:bg-amber-100"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Simulador
        </Link>
      </div>
    </div>
  );
}
