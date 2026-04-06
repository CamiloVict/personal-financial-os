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
      <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-1 flex items-center gap-1.5">
        Distribución sugerida
      </h2>
      <p className="text-[10px] text-slate-500 mb-3 leading-relaxed max-w-3xl">
        Cada tarjeta es un uso posible del capital con impacto <strong className="font-medium text-slate-600">modelado</strong>{' '}
        en liquidez, deuda, patrimonio o ahorro fiscal. El orden no es una orden de ejecución legal.
      </p>

      <AllocatorPlanSummary
        plan={plan}
        presentedAvailable={presentedAvailable}
        presentedUnallocated={presentedUnallocated}
        presentedAssigned={presentedAssigned}
        presentedCurrency={presentedCurrency}
        presentationLoading={presentationLoading}
      />

      {plan.engineNotes && plan.engineNotes.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {plan.engineNotes.map((note, i) => (
            <li
              key={i}
              className="rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-2 text-[10px] text-sky-950/90 leading-snug"
            >
              <span className="font-semibold text-sky-900">Liquidez: </span>
              {note}
            </li>
          ))}
        </ul>
      ) : null}

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

      {plan.surplusAlternatives && plan.surplusAlternatives.length > 0 ? (
        <div className="mt-8 pt-6 border-t border-amber-200/60">
          <h3 className="text-xs font-bold text-amber-900/90 tracking-tight mb-1">
            Otras formas de usar el mismo sobrante
          </h3>
          <p className="text-[10px] text-amber-900/75 mb-3 leading-relaxed max-w-3xl">
            Cada tarjeta muestra el <strong className="font-medium">mismo monto total</strong> que quedó libre
            después de fiscal, deuda y cubrir el déficit de metas: son <strong className="font-medium">mentalidades
            distintas</strong> (100% liquidez, 100% inversión, etc.). No las combines con el reparto de las tarjetas
            de arriba; elegí una lógica coherente. Montos en moneda del modelo (presentación global si aplica).
          </p>
          <div className="space-y-3">
            {plan.surplusAlternatives.map((scenario, index) => {
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
                  variant="reference"
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
