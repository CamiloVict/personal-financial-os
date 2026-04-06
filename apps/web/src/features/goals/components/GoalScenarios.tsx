import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Combine, HelpCircle } from 'lucide-react';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';

const GOAL_BOOK_CCY = 'COP';

interface GoalScenariosProps {
  scenarios: any[];
  isAchievable: boolean;
  currentMonthlySavings: number;
  presentedSavings?: number | null;
  presentedSavingsCurrency?: string;
  presentedByScenarioId?: Record<
    string,
    { income?: number; expense?: number; currency: string }
  >;
  presentationLoading?: boolean;
}

export function GoalScenarios({
  scenarios,
  isAchievable,
  currentMonthlySavings,
  presentedSavings,
  presentedSavingsCurrency,
  presentedByScenarioId,
  presentationLoading,
}: GoalScenariosProps) {
  const renderFeasibilityBadge = (level: string) => {
    switch (level) {
      case 'CONSERVATIVE': return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Conservador (Fácil)</span>;
      case 'REASONABLE': return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Razonable (Viable)</span>;
      case 'AGGRESSIVE': return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Agresivo (Difícil)</span>;
      case 'UNREALISTIC': return <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Poco Realista</span>;
      default: return null;
    }
  };

  const renderScenarioIcon = (type: string) => {
    switch (type) {
      case 'INCREASE_INCOME': return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'REDUCE_EXPENSES': return <TrendingDown className="w-5 h-5 text-blue-600" />;
      case 'COMBINED_STRATEGY': return <Combine className="w-5 h-5 text-fuchsia-600" />;
      default: return <HelpCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="mt-5">
      <h2 className="text-base font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
        Escenarios modelados
        {!isAchievable && <AlertTriangle className="w-4 h-4 text-amber-500" />}
      </h2>

      {isAchievable ? (
        <div className="glass-card bg-emerald-50/50 border-emerald-200/50 p-6 rounded-xl text-center">
          <h3 className="text-emerald-800 font-bold text-base tracking-tight mb-2">Según el modelo, la meta encaja en el plazo.</h3>
          <p className="text-emerald-700/80 text-xs mb-4">
            Si se mantuviera el ahorro mensual modelado (
            {presentationLoading &&
            (presentedSavings == null || !presentedSavingsCurrency)
              ? '…'
              : presentedSavings != null && presentedSavingsCurrency
                ? formatPresentedAmount(
                    presentedSavings,
                    presentedSavingsCurrency,
                  )
                : formatBookAmount(
                    Number(currentMonthlySavings),
                    GOAL_BOOK_CCY,
                  )}
            ), el tiempo estimado quedaría por debajo del plazo objetivo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {scenarios?.map((s: any) => (
              <div key={s.id} className="inline-block glass-panel border-emerald-500/20 p-3 rounded-lg text-[11px] text-slate-600">
                <strong className="block text-emerald-700 mb-1 uppercase tracking-wider text-[9px]">Dato interesante:</strong>
                {s.explanation}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios?.map((scenario: any) => (
            <div key={scenario.id} className="glass-card rounded-xl p-4 flex flex-col justify-between group hover:border-slate-300">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-1.5 rounded-lg backdrop-blur-md ${scenario.type === 'INCREASE_INCOME' ? 'bg-emerald-500/10' : scenario.type === 'REDUCE_EXPENSES' ? 'bg-blue-500/10' : 'bg-fuchsia-500/10'}`}>
                    {renderScenarioIcon(scenario.type)}
                  </div>
                  {renderFeasibilityBadge(scenario.feasibilityLevel)}
                </div>
                
                <h3 className="font-bold text-sm text-slate-800 tracking-tight mb-1.5">
                  {scenario.type === 'INCREASE_INCOME' && 'Escenario: más ingreso neto'}
                  {scenario.type === 'REDUCE_EXPENSES' && 'Escenario: menos gasto'}
                  {scenario.type === 'COMBINED_STRATEGY' && 'Escenario combinado'}
                </h3>
                
                <p className="text-slate-500 text-[11px] leading-relaxed mb-4">
                  {scenario.explanation}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Supuesto en el modelo</div>
                {scenario.incomeIncreaseAmount > 0 && (
                  <div className="flex justify-between items-center text-[11px] mb-1.5">
                    <span className="text-slate-600">Nuevos Ingresos:</span>
                    <span className="font-bold text-emerald-600">
                      {presentationLoading &&
                      presentedByScenarioId?.[scenario.id]?.income == null
                        ? '…'
                        : presentedByScenarioId?.[scenario.id]?.income != null
                          ? `+${formatPresentedAmount(
                              presentedByScenarioId[scenario.id].income!,
                              presentedByScenarioId[scenario.id].currency,
                            )}`
                          : `+${formatBookAmount(
                              Number(scenario.incomeIncreaseAmount),
                              GOAL_BOOK_CCY,
                            )}`}
                    </span>
                  </div>
                )}
                {scenario.expenseReductionAmount > 0 && (
                  <div className="flex justify-between items-center text-[11px] mb-1.5">
                    <span className="text-slate-600">Reducción Gastos:</span>
                    <span className="font-bold text-blue-600">
                      {presentationLoading &&
                      presentedByScenarioId?.[scenario.id]?.expense == null
                        ? '…'
                        : presentedByScenarioId?.[scenario.id]?.expense != null
                          ? `-${formatPresentedAmount(
                              presentedByScenarioId[scenario.id].expense!,
                              presentedByScenarioId[scenario.id].currency,
                            )}`
                          : `-${formatBookAmount(
                              Number(scenario.expenseReductionAmount),
                              GOAL_BOOK_CCY,
                            )}`}
                    </span>
                  </div>
                )}
                {scenario.newProjectedMonths && (
                  <div className="flex justify-between items-center text-[11px] mt-2.5 pt-2.5 border-t border-slate-200">
                    <span className="text-slate-500 font-semibold">Plazo estimado si se cumpliera el supuesto:</span>
                    <span className="font-bold text-slate-800">{scenario.newProjectedMonths} meses</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}