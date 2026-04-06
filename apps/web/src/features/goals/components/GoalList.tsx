import React from 'react';
import { Target, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';

const GOAL_BOOK_CCY = 'COP';

interface GoalListProps {
  goals: any[];
  isLoading: boolean;
  presentedByGoalId?: Record<
    string,
    { target: number; current: number; currency: string }
  >;
  presentationLoading?: boolean;
}

export function GoalList({
  goals,
  isLoading,
  presentedByGoalId,
  presentationLoading,
}: GoalListProps) {
  return (
    <div className="lg:col-span-8">
      <div className="glass-card rounded-xl flex flex-col h-full min-h-[300px]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Tus Metas Activas</h3>
          {isLoading && <Activity className="w-4 h-4 text-blue-500 animate-spin" />}
        </div>
        
        <div className="p-0 flex-1 bg-white rounded-b-xl">
          {goals.length === 0 && !isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Target className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-xs">No tienes metas configuradas.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {goals.map((goal: any) => {
                const targetNom = Number(goal.targetAmount);
                const currentNom = Number(goal.currentAmount || 0);
                const pres = presentedByGoalId?.[goal.id];
                const target = pres ? pres.target : targetNom;
                const current = pres ? pres.current : currentNom;
                const progress =
                  target > 0 ? Math.min(100, (current / target) * 100) : 0;

                return (
                  <li
                    key={goal.id}
                    className="p-4 transition-colors group active:bg-slate-100 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-slate-900 tracking-tight text-base">{goal.name}</h4>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                          Objetivo: {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {presentationLoading && !pres ? (
                          <p className="text-base font-bold text-slate-500">…</p>
                        ) : pres ? (
                          <>
                            <p className="text-base font-bold tracking-tight text-blue-600">
                              {formatPresentedAmount(
                                target,
                                pres.currency,
                              )}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                              Actual:{' '}
                              {formatPresentedAmount(current, pres.currency)}
                            </p>
                            <p className="text-[8px] text-slate-400 mt-0.5">
                              Nom. obj.:{' '}
                              {formatBookAmount(targetNom, GOAL_BOOK_CCY)} · Actual:{' '}
                              {formatBookAmount(currentNom, GOAL_BOOK_CCY)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-base font-bold tracking-tight text-blue-600">
                              {formatBookAmount(targetNom, GOAL_BOOK_CCY)}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                              Actual:{' '}
                              {formatBookAmount(currentNom, GOAL_BOOK_CCY)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 relative pt-1">
                      <div className="flex mb-1.5 items-center justify-between">
                        <div>
                          <span className="text-[9px] font-bold inline-block py-0.5 px-1.5 uppercase rounded-md text-blue-700 bg-blue-50 border border-blue-100">
                            {progress.toFixed(1)}% Progreso
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-slate-200">
                        <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500 rounded-full"></div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end transition-opacity hover-reveal-actions">
                      <Link
                        href={`/goals/${goal.id}`}
                        className="touch-manipulation inline-flex items-center gap-1 bg-slate-900 active:bg-slate-700 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-800 text-white px-3 py-2 min-h-9 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all shadow-sm"
                      >
                        Ver escenarios <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}