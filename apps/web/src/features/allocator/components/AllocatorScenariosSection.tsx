import type { AllocatorPlan } from '../types';
import { AllocatorPlanSummary } from './AllocatorPlanSummary';
import { AllocatorScenariosEmpty } from './AllocatorScenariosEmpty';
import { AllocatorScenarioItem } from './AllocatorScenarioItem';

interface AllocatorScenariosSectionProps {
  plan: AllocatorPlan;
  presentedAvailable?: number | null;
  presentedUnallocated?: number | null;
  presentedAssigned?: number | null;
  presentedCurrency?: string;
  presentedByScenarioId?: Record<
    string,
    { modeled: number; expectedReturn: number }
  >;
  presentationLoading?: boolean;
}

export function AllocatorScenariosSection({
  plan,
  presentedAvailable,
  presentedUnallocated,
  presentedAssigned,
  presentedCurrency,
  presentedByScenarioId,
  presentationLoading,
}: AllocatorScenariosSectionProps) {
  return (
    <div className="mt-6 animate-in slide-in-from-bottom-8 duration-500">
      <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-3 flex items-center gap-1.5">
        Escenarios modelados (orden ilustrativo)
      </h2>

      <AllocatorPlanSummary
        plan={plan}
        presentedAvailable={presentedAvailable}
        presentedUnallocated={presentedUnallocated}
        presentedAssigned={presentedAssigned}
        presentedCurrency={presentedCurrency}
        presentationLoading={presentationLoading}
      />

      {plan.scenarios.length === 0 ? (
        <AllocatorScenariosEmpty />
      ) : (
        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {plan.scenarios.map((scenario, index) => {
            const pres = presentedByScenarioId?.[scenario.id];
            return (
              <AllocatorScenarioItem
                key={scenario.id}
                scenario={scenario}
                index={index}
                presentedModeled={pres?.modeled ?? null}
                presentedReturn={pres?.expectedReturn ?? null}
                presentedCurrency={presentedCurrency}
                presentationLoading={presentationLoading}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
