import type { AllocatorPlan } from '../types';
import { AllocatorPlanSummary } from './AllocatorPlanSummary';
import { AllocatorRecommendationsEmpty } from './AllocatorRecommendationsEmpty';
import { AllocatorRecommendationItem } from './AllocatorRecommendationItem';

interface AllocatorRecommendationsSectionProps {
  plan: AllocatorPlan;
}

export function AllocatorRecommendationsSection({ plan }: AllocatorRecommendationsSectionProps) {
  return (
    <div className="mt-6 animate-in slide-in-from-bottom-8 duration-500">
      <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-3 flex items-center gap-1.5">
        Ruta de Asignación Óptima
      </h2>

      <AllocatorPlanSummary plan={plan} />

      {plan.recommendations.length === 0 ? (
        <AllocatorRecommendationsEmpty />
      ) : (
        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {plan.recommendations.map((rec, index) => (
            <AllocatorRecommendationItem key={rec.id} rec={rec} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
