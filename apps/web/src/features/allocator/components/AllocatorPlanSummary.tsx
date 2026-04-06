import type { AllocatorPlan } from '../types';

interface AllocatorPlanSummaryProps {
  plan: AllocatorPlan;
}

export function AllocatorPlanSummary({ plan }: AllocatorPlanSummaryProps) {
  const assigned = Number(plan.availableCapital) - Number(plan.unallocatedCapital);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <div className="glass-card rounded-lg p-3 bg-slate-50 border-slate-200">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
          Capital Original
        </p>
        <p className="text-base font-bold text-slate-800">
          ${Number(plan.availableCapital).toLocaleString()}
        </p>
      </div>
      <div className="glass-card rounded-lg p-3 bg-emerald-50/50 border-emerald-100">
        <p className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-wider mb-0.5">
          Usado en escenarios
        </p>
        <p className="text-base font-bold text-emerald-700">${assigned.toLocaleString()}</p>
      </div>
      <div className="glass-card rounded-lg p-3 bg-amber-50/50 border-amber-100">
        <p className="text-[9px] font-bold text-amber-600/80 uppercase tracking-wider mb-0.5">
          Sobrante
        </p>
        <p className="text-base font-bold text-amber-700">
          ${Number(plan.unallocatedCapital).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
