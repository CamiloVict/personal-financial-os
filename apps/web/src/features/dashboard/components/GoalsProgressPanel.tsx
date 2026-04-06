import React from 'react';
import Link from 'next/link';
import { Target } from 'lucide-react';

export type GoalProgressRow = {
  id: string;
  name: string;
  progress: number;
};

export function GoalsProgressPanel({
  goals,
  loading,
}: {
  goals: GoalProgressRow[];
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-blue-600" aria-hidden />
            Metas
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Avance hacia el objetivo</p>
        </div>
        <Link
          href="/goals"
          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Ver todas
        </Link>
      </div>
      {loading ? (
        <p className="text-xs text-slate-400 py-6 text-center">…</p>
      ) : goals.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center rounded-lg bg-slate-50 border border-dashed border-slate-200">
          Aún no hay metas. Creá una en{' '}
          <Link href="/goals" className="font-semibold text-indigo-600 underline-offset-2 hover:underline">
            Metas
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3 flex-1 min-h-0 overflow-y-auto">
          {goals.slice(0, 6).map((g) => (
            <li key={g.id}>
              <div className="flex justify-between text-[11px] gap-2 mb-1">
                <span className="font-medium text-slate-800 truncate">{g.name}</span>
                <span className="text-slate-500 tabular-nums shrink-0">
                  {(g.progress * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
                  style={{ width: `${Math.min(100, g.progress * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
