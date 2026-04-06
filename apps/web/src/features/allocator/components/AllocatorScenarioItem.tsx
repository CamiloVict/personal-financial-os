import { ArrowRight } from 'lucide-react';
import type { AllocatorScenario } from '../types';
import { scenarioCardClass, scenarioIcon } from './scenarioMeta';
import { formatPresentedAmount } from '@/features/currency/format';

interface AllocatorScenarioItemProps {
  scenario: AllocatorScenario;
  index: number;
  presentedModeled?: number | null;
  presentedReturn?: number | null;
  presentedCurrency?: string;
  presentationLoading?: boolean;
}

export function AllocatorScenarioItem({
  scenario,
  index,
  presentedModeled,
  presentedReturn,
  presentedCurrency = 'USD',
  presentationLoading,
}: AllocatorScenarioItemProps) {
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
        <span className="text-[10px] font-bold">{index + 1}</span>
      </div>

      <div
        className={`glass-card w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-3.5 rounded-xl shadow-sm border ${scenarioCardClass(scenario.type)} transition-all hover:shadow-md`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5">
            {scenarioIcon(scenario.type)}
            <h3 className="font-bold text-slate-900 text-xs">{scenario.title}</h3>
          </div>
          <span className="bg-white text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-slate-100">
            Peso modelo: {scenario.priorityScore}
          </span>
        </div>

        <p className="text-[10px] text-slate-600 mb-3 leading-relaxed">{scenario.description}</p>

        <div className="bg-white/60 p-2 rounded-md flex justify-between items-center border border-white/40">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Monto en escenario
            </p>
            <p className="font-black text-slate-800 text-sm">
              {presentationLoading
                ? '…'
                : presentedModeled != null
                  ? formatPresentedAmount(
                      presentedModeled,
                      presentedCurrency,
                    )
                  : `$${Number(scenario.modeledAmount).toLocaleString()}`}
            </p>
            {presentedModeled != null && !presentationLoading ? (
              <p className="text-[8px] text-slate-400 mt-0.5">
                Nom.: ${Number(scenario.modeledAmount).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Efecto estimado (modelo)
            </p>
            {scenario.expectedReturnAmount > 0 ? (
              <p className="font-bold text-emerald-600 text-xs">
                {presentationLoading
                  ? '…'
                  : presentedReturn != null
                    ? `+${formatPresentedAmount(
                        presentedReturn,
                        presentedCurrency,
                      )} `
                    : `+$${Number(scenario.expectedReturnAmount).toLocaleString()} `}
                <span className="text-[9px]">({scenario.returnPercentage}%)</span>
              </p>
            ) : (
              <p className="font-bold text-blue-600 text-xs flex items-center gap-1 justify-end">
                Solo asignación <ArrowRight className="w-3 h-3" />
              </p>
            )}
            {presentedReturn != null &&
            !presentationLoading &&
            scenario.expectedReturnAmount > 0 ? (
              <p className="text-[8px] text-slate-400 mt-0.5">
                Nom.: +$
                {Number(scenario.expectedReturnAmount).toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
