'use client';
import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { useGoals, useCreateGoal } from '@/features/goals/api/queries';
import { GoalForm, GoalList } from '@/features/goals/components';

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoalMutation = useCreateGoal();

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
        />
      </div>
    </div>
  );
}