import type { AllocatorEntryMeta, AllocatorPlan } from '../types';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';

const ALLOC_BOOK_CCY = 'USD';

interface AllocatorPlanSummaryProps {
  plan: AllocatorPlan;
  presentedAvailable?: number | null;
  presentedUnallocated?: number | null;
  presentedAssigned?: number | null;
  presentedCurrency?: string;
  presentationLoading?: boolean;
  entryMeta?: AllocatorEntryMeta | null;
}

export function AllocatorPlanSummary({
  plan,
  presentedAvailable,
  presentedUnallocated,
  presentedAssigned,
  presentedCurrency = 'USD',
  presentationLoading,
  entryMeta,
}: AllocatorPlanSummaryProps) {
  const scenariosBookSum = plan.scenarios.reduce(
    (a, s) => a + Number(s.modeledAmount),
    0,
  );
  const assignedNom = scenariosBookSum;
  const useP =
    presentedAvailable != null &&
    presentedUnallocated != null &&
    presentedAssigned != null &&
    !presentationLoading;
  const avail = useP ? presentedAvailable! : Number(plan.availableCapital);
  const unalloc = useP ? presentedUnallocated! : Number(plan.unallocatedCapital);
  const assigned = useP ? presentedAssigned! : assignedNom;
  const fmt = (n: number) =>
    useP
      ? formatPresentedAmount(n, presentedCurrency)
      : formatBookAmount(n, ALLOC_BOOK_CCY);

  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="glass-card rounded-lg p-3 bg-slate-50 border-slate-200">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
          Capital de entrada
        </p>
        <p className="text-base font-bold text-slate-800">
          {presentationLoading ? '…' : fmt(avail)}
        </p>
        {useP ? (
          <div className="mt-1 space-y-0.5">
            <p className="text-[9px] text-slate-400">
              USD libro (motor):{' '}
              {formatBookAmount(Number(plan.availableCapital), ALLOC_BOOK_CCY)}
            </p>
            {entryMeta ? (
              <p className="text-[9px] text-slate-500 leading-snug">
                Tu entrada: {formatBookAmount(entryMeta.inputAmount, entryMeta.inputCurrency)} → conversión al{' '}
                {entryMeta.valuationAsOfDate}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="glass-card rounded-lg p-3 bg-emerald-50/50 border-emerald-100">
        <p className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-wider mb-0.5">
          Asignado en tarjetas
        </p>
        <p className="text-base font-bold text-emerald-700">
          {presentationLoading ? '…' : fmt(assigned)}
        </p>
        {useP ? (
          <p className="text-[9px] text-emerald-700/70 mt-0.5">
            Nom.: {formatBookAmount(assignedNom, ALLOC_BOOK_CCY)}
          </p>
        ) : null}
      </div>
      <div className="glass-card rounded-lg p-3 bg-amber-50/50 border-amber-100">
        <p className="text-[9px] font-bold text-amber-600/80 uppercase tracking-wider mb-0.5">
          Sin asignar (modelo)
        </p>
        <p className="text-base font-bold text-amber-700">
          {presentationLoading ? '…' : fmt(unalloc)}
        </p>
        {useP ? (
          <p className="text-[9px] text-amber-800/70 mt-0.5">
            Nom.:{' '}
            {formatBookAmount(Number(plan.unallocatedCapital), ALLOC_BOOK_CCY)}
          </p>
        ) : null}
      </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-500 leading-relaxed max-w-3xl">
        <strong className="font-medium text-slate-600">Entrada</strong>{' '}
        {entryMeta ? (
          <>
            en pantalla sigue la moneda de tu barra global; ingresaste en {entryMeta.inputCurrency} y el motor trabajó
            con {formatBookAmount(entryMeta.bookUsdAmount, 'USD')} USD libro.{' '}
          </>
        ) : (
          <>
            coincide con el monto del formulario en la moneda de tu barra (COP o USD); el motor siempre recibe USD
            libro.{' '}
          </>
        )}
        <strong className="font-medium text-slate-600">Asignado</strong> es la suma de los montos de las tarjetas de la
        distribución de arriba (no incluye &quot;Otras formas&quot;).{' '}
        <strong className="font-medium text-slate-600">Sin asignar</strong> es entrada menos asignado en la vista
        actual. En USD libro: asignado + sin asignar = entrada del motor.
      </p>
    </div>
  );
}
