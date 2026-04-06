import Link from 'next/link';
import { Network, Sparkles } from 'lucide-react';
import { TrustBadge } from '@/shared/ui/TrustProvenance';

export function SimulatorPageHeader() {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end border-b border-slate-200/50 pb-2 mb-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <div className="p-1 bg-amber-100 rounded-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            La Máquina del Tiempo Financiera
          </h1>
          <TrustBadge kind="SIMULATED" />
        </div>
        <p className="text-slate-500 mt-1 text-[10px] leading-relaxed max-w-3xl">
          <strong className="font-medium text-slate-700">Pregunta:</strong> ¿Qué pasa si…? Siempre verás una{' '}
          <strong className="font-medium text-slate-700">línea base</strong> frente a un{' '}
          <strong className="font-medium text-slate-700">escenario</strong> con la acción modelada, más el{' '}
          <strong className="font-medium text-slate-700">delta</strong> de patrimonio al final del plazo. No modifica
          tus registros ni el perfil fiscal guardado. Valuación global según la barra superior.
        </p>
      </div>
      <Link
        href="/allocator"
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-fuchsia-200/80 bg-fuchsia-50 px-2.5 py-1.5 text-[10px] font-semibold text-fuchsia-800 transition-colors hover:bg-fuchsia-100 sm:self-auto"
      >
        <Network className="w-3 h-3" aria-hidden />
        Asignación
      </Link>
    </header>
  );
}
