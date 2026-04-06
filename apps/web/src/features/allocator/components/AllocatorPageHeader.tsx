import Link from 'next/link';
import { Network, Sparkles } from 'lucide-react';

export function AllocatorPageHeader() {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end border-b border-slate-200/50 pb-4 mb-4">
      <div className="min-w-0">
        <h1 className="page-section-title flex items-center gap-2">
          <div className="rounded-md bg-fuchsia-100 p-1">
            <Network className="h-4 w-4 text-fuchsia-600" />
          </div>
          Simulador de asignación de capital
        </h1>
        <p className="page-section-subtitle max-w-3xl text-[11px] sm:text-sm">
          Indica un monto hipotético; el modelo cruza impuestos, deudas y metas registradas y muestra
          escenarios con efectos estimados. No es asesoría ni instrucción de actuar.
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
