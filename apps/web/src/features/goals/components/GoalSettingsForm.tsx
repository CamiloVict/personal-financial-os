'use client';

import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useUpdateGoal } from '@/features/goals/api/queries';

type Mode = 'NONE' | 'AMOUNT' | 'PERCENT';
type Cadence = 'QUARTERLY' | 'MANUAL';

export function GoalSettingsForm({
  goalId,
  goal,
}: {
  goalId: string;
  goal: any;
}) {
  const update = useUpdateGoal(goalId);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [utilityMode, setUtilityMode] = useState<Mode>('NONE');
  const [utilityCadence, setUtilityCadence] = useState<Cadence>('MANUAL');
  const [utilityValue, setUtilityValue] = useState('');

  useEffect(() => {
    if (!goal) return;
    setName(goal.name ?? '');
    setTargetAmount(String(goal.targetAmount ?? ''));
    setCurrentAmount(String(goal.currentAmount ?? ''));
    setTargetDate(
      goal.targetDate ? new Date(goal.targetDate).toISOString().slice(0, 10) : '',
    );
    setCurrency(goal.currency === 'USD' ? 'USD' : 'COP');
    setUtilityMode((goal.utilityMode as Mode) || 'NONE');
    setUtilityCadence((goal.utilityCadence as Cadence) || 'MANUAL');
    setUtilityValue(String(goal.utilityValue ?? ''));
  }, [goal]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({
      name,
      targetAmount: Number(targetAmount) || 0,
      currentAmount: Number(currentAmount) || 0,
      targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      currency: currency === 'USD' ? 'USD' : 'COP',
      utilityMode,
      utilityCadence,
      utilityValue: Number(utilityValue) || 0,
    });
  };

  const ccyLabel = currency === 'USD' ? 'USD' : 'COP';

  return (
    <form
      onSubmit={onSubmit}
      className="glass-card rounded-xl border border-slate-200 p-4 space-y-3 text-sm"
    >
      <h2 className="text-sm font-bold text-slate-900">Configuración de la meta</h2>
      <p className="text-[10px] text-slate-500 leading-snug">
        Moneda, montos y utilidades (monto o %, trimestral o manual). Tras guardar se recalculan escenarios y
        proyección.
      </p>

      <div>
        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="glass-input w-full p-2 rounded-lg text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm"
          >
            <option value="COP">COP</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
            Fecha objetivo (opcional)
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
            Objetivo ({ccyLabel})
          </label>
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm"
            min={0}
            step="any"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
            Saldo actual ({ccyLabel})
          </label>
          <input
            type="number"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm"
            min={0}
            step="any"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase text-slate-600">Utilidades</p>
        <select
          value={utilityMode}
          onChange={(e) => setUtilityMode(e.target.value as Mode)}
          className="glass-input w-full p-2 rounded-lg text-sm"
        >
          <option value="NONE">Ninguna (solo cashflow)</option>
          <option value="AMOUNT">Monto por período</option>
          <option value="PERCENT">% del saldo por período</option>
        </select>
        {utilityMode !== 'NONE' ? (
          <>
            <select
              value={utilityCadence}
              onChange={(e) => setUtilityCadence(e.target.value as Cadence)}
              className="glass-input w-full p-2 rounded-lg text-sm"
            >
              <option value="QUARTERLY">Trimestral</option>
              <option value="MANUAL">Manual</option>
            </select>
            <input
              type="number"
              value={utilityValue}
              onChange={(e) => setUtilityValue(e.target.value)}
              className="glass-input w-full p-2 rounded-lg text-sm"
              placeholder={utilityMode === 'PERCENT' ? '%' : ccyLabel}
              min={0}
              max={utilityMode === 'PERCENT' ? 100 : undefined}
              step="any"
            />
          </>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={update.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        <Save className="w-3.5 h-3.5" />
        {update.isPending ? 'Guardando…' : 'Guardar y recalcular'}
      </button>
    </form>
  );
}
