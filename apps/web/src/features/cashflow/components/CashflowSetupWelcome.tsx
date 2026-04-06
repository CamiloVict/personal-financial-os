import Link from 'next/link';
import { ArrowRight, Layers, PieChart, Sparkles } from 'lucide-react';

interface CashflowSetupWelcomeProps {
  /** true mientras el usuario no tenga ningún flujo (ingreso/gasto) ni inversión */
  visible: boolean;
  /** Sin categorías cargadas: el formulario muestra primero «Generar categorías base» */
  needsCategoriesFirst?: boolean;
}

const formAnchorClass =
  'font-semibold text-blue-700 hover:underline inline-flex items-center gap-0.5';

/**
 * Ayuda inicial en Cashflow: permanece visible hasta que exista al menos un stream o una posición.
 */
export function CashflowSetupWelcome({
  visible,
  needsCategoriesFirst = false,
}: CashflowSetupWelcomeProps) {
  if (!visible) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-linear-to-br from-blue-50 to-white p-4 shadow-sm mb-2">
      <div className="flex gap-3">
        <div className="shrink-0 p-2 bg-blue-100 rounded-lg h-fit">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0 space-y-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Configura tu base financiera
          </h2>
          <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl">
            Este aviso desaparece cuando registres al menos un <strong>ingreso</strong>, un{' '}
            <strong>gasto</strong> recurrente o una <strong>inversión</strong>. Así el dashboard y el
            resto de módulos tienen datos con los que trabajar.
          </p>
          <ol className="text-[10px] text-slate-700 space-y-1.5 pt-1">
            <li className="flex items-start gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <a href="#cashflow-nuevo-flujo" className={formAnchorClass}>
                  Ir a Crear flujo <ArrowRight className="w-3 h-3" />
                </a>
                {needsCategoriesFirst ? (
                  <>
                    {' '}
                    — en ese panel, pulsa <strong>Generar categorías base</strong> y, cuando aparezca
                    el formulario, define tu primer ingreso o gasto (nombre, categoría y monto).
                  </>
                ) : (
                  <>
                    {' '}
                    — elige ingreso o gasto, categoría, monto y frecuencia, y guarda.
                  </>
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <PieChart className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Opcional: registra{' '}
                <Link
                  href="/investment-positions"
                  className="font-semibold text-blue-700 hover:underline inline-flex items-center gap-0.5"
                >
                  una inversión <ArrowRight className="w-3 h-3" />
                </Link>{' '}
                y luego visita el{' '}
                <Link href="/" className="font-semibold text-blue-700 hover:underline">
                  dashboard
                </Link>
                .
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
