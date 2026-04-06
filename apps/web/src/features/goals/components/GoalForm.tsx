import React, { Dispatch, SetStateAction } from 'react';
import { Plus } from 'lucide-react';

export type GoalUtilityModeUi = 'NONE' | 'AMOUNT' | 'PERCENT';
export type GoalUtilityCadenceUi = 'QUARTERLY' | 'MANUAL';

interface GoalFormProps {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  targetAmount: string;
  setTargetAmount: Dispatch<SetStateAction<string>>;
  currentAmount: string;
  setCurrentAmount: Dispatch<SetStateAction<string>>;
  targetDate: string;
  setTargetDate: Dispatch<SetStateAction<string>>;
  currency: string;
  setCurrency: Dispatch<SetStateAction<string>>;
  utilityMode: GoalUtilityModeUi;
  setUtilityMode: Dispatch<SetStateAction<GoalUtilityModeUi>>;
  utilityCadence: GoalUtilityCadenceUi;
  setUtilityCadence: Dispatch<SetStateAction<GoalUtilityCadenceUi>>;
  utilityValue: string;
  setUtilityValue: Dispatch<SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function GoalForm({
  name,
  setName,
  targetAmount,
  setTargetAmount,
  currentAmount,
  setCurrentAmount,
  targetDate,
  setTargetDate,
  currency,
  setCurrency,
  utilityMode,
  setUtilityMode,
  utilityCadence,
  setUtilityCadence,
  utilityValue,
  setUtilityValue,
  onSubmit,
  isPending,
}: GoalFormProps) {
  const ccyLabel = currency === 'USD' ? 'USD' : 'COP';
  return (
    <div className="lg:col-span-4 glass-card p-4 rounded-xl self-start">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4">Crear nueva meta</h3>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Nombre
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm"
            placeholder="Ej. Fondo de emergencia, viaje…"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Moneda de la meta
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm"
          >
            <option value="COP">COP (pesos)</option>
            <option value="USD">USD (dólares)</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-1 leading-snug">
            Objetivo y saldo actual se interpretan en esta moneda; el cashflow puede seguir en otras.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Monto objetivo ({ccyLabel})
          </label>
          <input
            type="number"
            required
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm"
            placeholder="0"
            min={0}
            step="any"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Ahorro actual inicial ({ccyLabel})
          </label>
          <input
            type="number"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm"
            placeholder="0"
            min={0}
            step="any"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Fecha objetivo
          </label>
          <input
            type="date"
            required
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
            Utilidades hacia la meta (ajuste manual / modelo)
          </p>
          <p className="text-[10px] text-slate-500 leading-snug">
            Si la meta crece por utilidades reinvertidas: definí si el modelo usa un monto o un % del saldo, y si
            es trimestral (se reparte en el flujo mensual del modelo) o manual (actualizás el saldo cuando
            corresponda; el modelo no suma utilidades automáticas).
          </p>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Tipo</label>
            <select
              value={utilityMode}
              onChange={(e) => setUtilityMode(e.target.value as GoalUtilityModeUi)}
              className="glass-input w-full p-2 rounded-lg text-sm"
            >
              <option value="NONE">Sin utilidades modeladas (solo flujo cashflow)</option>
              <option value="AMOUNT">Monto por período ({ccyLabel})</option>
              <option value="PERCENT">Porcentaje del saldo actual por período</option>
            </select>
          </div>
          {utilityMode !== 'NONE' ? (
            <>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Cadencia</label>
                <select
                  value={utilityCadence}
                  onChange={(e) => setUtilityCadence(e.target.value as GoalUtilityCadenceUi)}
                  className="glass-input w-full p-2 rounded-lg text-sm"
                >
                  <option value="QUARTERLY">Trimestral (equiv. mensual en el modelo)</option>
                  <option value="MANUAL">Manual (no suma al flujo; actualizá saldo)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  {utilityMode === 'AMOUNT'
                    ? `Monto por período (${ccyLabel})`
                    : 'Porcentaje por período (0–100)'}
                </label>
                <input
                  type="number"
                  value={utilityValue}
                  onChange={(e) => setUtilityValue(e.target.value)}
                  className="glass-input w-full p-2 rounded-lg text-sm"
                  placeholder={utilityMode === 'AMOUNT' ? '0' : '0'}
                  min={0}
                  max={utilityMode === 'PERCENT' ? 100 : undefined}
                  step="any"
                />
              </div>
            </>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold flex justify-center items-center gap-1.5 transition-all text-xs shadow-sm disabled:opacity-60"
        >
          <Plus className="w-3.5 h-3.5" />
          {isPending ? 'Creando…' : 'Guardar meta'}
        </button>
      </form>
    </div>
  );
}
