'use client';

import React, { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import {
  useGoalProgressLogs,
  useAddGoalProgressLog,
} from '@/features/goals/api/queries';
import { formatBookAmount } from '@/features/currency/format';

export function GoalProgressSection({
  goalId,
  bookCurrency = 'COP',
  onLogged,
}: {
  goalId: string;
  bookCurrency?: string;
  onLogged?: () => void;
}) {
  const { data: logs = [], isLoading } = useGoalProgressLogs(goalId);
  const addLog = useAddGoalProgressLog(goalId);
  const [note, setNote] = useState('');
  const [amountDelta, setAmountDelta] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = note.trim();
    if (!n) return;
    const amt = Number(amountDelta);
    addLog.mutate(
      {
        note: n,
        amountDelta: Number.isFinite(amt) && amt > 0 ? amt : 0,
      },
      {
        onSuccess: () => {
          setNote('');
          setAmountDelta('');
          onLogged?.();
        },
      },
    );
  };

  return (
    <section className="glass-card rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <ClipboardList className="h-5 w-5 text-blue-600" aria-hidden />
        <div>
          <h2 className="text-sm font-bold text-slate-900">Novedades y avances</h2>
          <p className="text-[10px] text-slate-500">
            Registrá qué hiciste para acercarte a la meta. Podés sumar un monto al saldo actual si
            aportaste dinero.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
            Qué hiciste / nota
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="glass-input w-full p-2 rounded-lg text-sm min-h-[72px]"
            placeholder="Ej. Transferí a la cuenta de la meta, vendí algo, recibí bono…"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
            Sumar al saldo actual ({bookCurrency}, opcional)
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={amountDelta}
            onChange={(e) => setAmountDelta(e.target.value)}
            className="glass-input w-full max-w-xs p-2 rounded-lg text-sm"
            placeholder="0 = solo registro"
          />
        </div>
        <button
          type="submit"
          disabled={addLog.isPending || !note.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLog.isPending ? 'Guardando…' : 'Registrar novedad'}
        </button>
      </form>

      <div>
        <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-2">Historial</h3>
        {isLoading ? (
          <p className="text-xs text-slate-400">Cargando…</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Todavía no hay registros.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {logs.map((l) => (
              <li
                key={l.id}
                className="text-xs border border-slate-100 rounded-lg p-2.5 bg-slate-50/80"
              >
                <p className="text-slate-800 whitespace-pre-wrap">{l.note}</p>
                <div className="flex flex-wrap justify-between gap-1 mt-1.5 text-[10px] text-slate-500">
                  <span>
                    {new Date(l.createdAt).toLocaleString('es-CO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  {l.amountDelta > 0 ? (
                    <span className="font-semibold text-emerald-700">
                      +{formatBookAmount(l.amountDelta, bookCurrency)} al saldo
                    </span>
                  ) : (
                    <span className="text-slate-400">Solo bitácora</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
