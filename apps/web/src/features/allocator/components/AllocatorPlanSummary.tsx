import type { AllocatorPlan } from '../types';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';

const ALLOC_BOOK_CCY = 'USD';

interface AllocatorPlanSummaryProps {
  plan: AllocatorPlan;
  presentedAvailable?: number | null;
  presentedUnallocated?: number | null;
  presentedAssigned?: number | null;
  presentedCurrency?: string;
  presentationLoading?: boolean;
}

export function AllocatorPlanSummary({
  plan,
  presentedAvailable,
  presentedUnallocated,
  presentedAssigned,
  presentedCurrency = 'USD',
  presentationLoading,
}: AllocatorPlanSummaryProps) {
  const assignedNom =
    Number(plan.availableCapital) - Number(plan.unallocatedCapital);
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <div className="glass-card rounded-lg p-3 bg-slate-50 border-slate-200">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
          Capital disponible (entrada)
        </p>
        <p className="text-base font-bold text-slate-800">
          {presentationLoading ? '…' : fmt(avail)}
        </p>
        {useP ? (
          <p className="text-[9px] text-slate-400 mt-0.5">
            Nom.:{' '}
            {formatBookAmount(Number(plan.availableCapital), ALLOC_BOOK_CCY)}
          </p>
        ) : null}
      </div>
      <div className="glass-card rounded-lg p-3 bg-emerald-50/50 border-emerald-100">
        <p className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-wider mb-0.5">
          Usado en escenarios
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
          Sobrante
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
  );
}
