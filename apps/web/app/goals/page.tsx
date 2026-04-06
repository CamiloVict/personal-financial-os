'use client';
import React, { useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import { useGoals, useCreateGoal } from '@/features/goals/api/queries';
import { GoalForm, GoalList } from '@/features/goals/components';
import { useValuationPresentation } from '@/features/currency/hooks/useValuationPresentation';
import {
  linesFromGoals,
  presentedCurrencyFromRows,
} from '@/features/currency/valuationUtils';
import { useGlobalStore } from '@/shared/store/global';

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoalMutation = useCreateGoal();
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);
  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);

  const goalLines = useMemo(
    () => linesFromGoals(goals, valuationAsOfDate),
    [goals, valuationAsOfDate],
  );
  const { data: goalPresRows, isLoading: goalPresLoading } =
    useValuationPresentation(goalLines, goalLines.length > 0);

  const presentedByGoalId = useMemo(() => {
    if (!goalPresRows?.length) return undefined;
    const ccy = presentedCurrencyFromRows(
      goalPresRows,
      displayValuationMode,
    );
    const m: Record<
      string,
      { target: number; current: number; currency: string }
    > = {};
    for (const g of goals) {
      const t = goalPresRows.find((r) => r.id === `${g.id}-target`);
      const c = goalPresRows.find((r) => r.id === `${g.id}-current`);
      if (t && c) {
        m[g.id] = {
          target: t.presentedAmount,
          current: c.presentedAmount,
          currency: ccy,
        };
      }
    }
    return Object.keys(m).length ? m : undefined;
  }, [goalPresRows, goals, displayValuationMode]);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate({
      name,
      targetAmount: Number(targetAmount) || 0,
      currentAmount: Number(currentAmount) || 0,
      targetDate: new Date(targetDate).toISOString()
    }, {
      onSuccess: () => {
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setTargetDate('');
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-slate-200/50 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            Metas Financieras
          </h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Registra objetivos y abre la simulación para ver escenarios condicionales según el cashflow que tengas en la app.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <GoalForm 
          name={name} setName={setName}
          targetAmount={targetAmount} setTargetAmount={setTargetAmount}
          currentAmount={currentAmount} setCurrentAmount={setCurrentAmount}
          targetDate={targetDate} setTargetDate={setTargetDate}
          onSubmit={handleSubmit}
          isPending={createGoalMutation.isPending}
        />

        <GoalList
          goals={goals}
          isLoading={isLoading}
          presentedByGoalId={presentedByGoalId}
          presentationLoading={goalPresLoading}
        />
      </div>
    </div>
  );
}