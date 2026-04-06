import Link from 'next/link';
import { Network, Sparkles } from 'lucide-react';
import { TrustBadge } from '@/shared/ui/TrustProvenance';

export function AllocatorPageHeader() {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end border-b border-slate-200/50 pb-4 mb-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="page-section-title flex items-center gap-2">
            <div className="rounded-md bg-fuchsia-100 p-1">
              <Network className="h-4 w-4 text-fuchsia-600" />
            </div>
            Asignación de capital
          </h1>
          <TrustBadge kind="SIMULATED" />
          <TrustBadge kind="ESTIMATED" />
        </div>
        <p className="page-section-subtitle max-w-3xl text-[11px] sm:text-sm">
          <strong className="font-medium text-slate-800">Pregunta:</strong> ¿Cómo distribuyo este capital? Ingresás
          un monto <strong className="font-medium text-slate-800">hipotético</strong>; el modelo sugiere repartos
          según deudas, perfil fiscal y metas que ya tenés en la app. Es ilustrativo:{' '}
          <strong className="font-medium text-slate-800">no</strong> ejecuta pagos ni inversiones. Para comparar dos
          futuros numéricos (base vs acción) usá el{' '}
          <strong className="font-medium text-slate-800">Simulador</strong>.
        </p>
      </div>
      <Link
        href="/simulator"
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 sm:self-auto"
      >
        <Sparkles className="w-3.5 h-3.5" aria-hidden />
        Simulador
      </Link>
    </header>
  );
}
