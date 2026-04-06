import Link from 'next/link';
import { Network } from 'lucide-react';

/**
 * Una sola idea por pantalla: aquí se compara siempre línea base vs “qué pasa si”.
 */
export function SimulatorFramingBanner() {
  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-[10px] leading-relaxed text-amber-950/90">
      <p>
        <strong className="font-semibold text-amber-950">¿Qué pasa si…?</strong> Cada simulación contrasta una{' '}
        <strong className="font-medium">línea base</strong> (sin la acción) frente al{' '}
        <strong className="font-medium">escenario</strong> (con la acción). Los KPIs y el gráfico muestran esa brecha.
      </p>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-amber-900/85">
          Para <strong className="font-medium">repartir un monto</strong> entre usos con el modelo:
        </span>
        <Link
          href="/allocator"
          className="inline-flex items-center gap-1 font-semibold text-fuchsia-800 underline decoration-fuchsia-300 underline-offset-2"
        >
          <Network className="w-3 h-3 shrink-0" aria-hidden />
          Asignación de capital
        </Link>
      </p>
    </div>
  );
}
