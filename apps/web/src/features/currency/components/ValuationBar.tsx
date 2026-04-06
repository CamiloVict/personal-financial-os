'use client';

import { useEffect, useRef } from 'react';
import { Scale } from 'lucide-react';
import {
  useGlobalStore,
  type DisplayValuationMode,
} from '@/shared/store/global';
import {
  usePatchUserPreferences,
  useUserPreferences,
} from '@/features/currency/api/queries';
import { valuationModeFootnote } from '@/features/currency/format';

const MODES: { id: DisplayValuationMode; label: string }[] = [
  { id: 'NOMINAL_COP', label: 'COP nominal' },
  { id: 'NOMINAL_USD', label: 'USD nominal' },
  { id: 'REAL_COP', label: 'COP real (IPC)' },
];

export function ValuationBar() {
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);
  const realTermsBaseMonth = useGlobalStore((s) => s.realTermsBaseMonth);
  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);
  const setValuation = useGlobalStore((s) => s.setValuation);

  const hydrated = useRef(false);
  const { data: prefs } = useUserPreferences(true);
  const patch = usePatchUserPreferences();

  useEffect(() => {
    if (!prefs || hydrated.current) return;
    hydrated.current = true;
    setValuation({
      displayValuationMode: prefs.displayValuationMode as DisplayValuationMode,
      realTermsBaseMonth:
        prefs.realTermsBaseMonth?.toString().slice(0, 10) ?? '2020-01-01',
      valuationAsOfDate:
        prefs.valuationAsOfDate?.toString().slice(0, 10) ??
        new Date().toISOString().slice(0, 10),
    });
  }, [prefs, setValuation]);

  const pushServer = (body: {
    displayValuationMode?: string;
    realTermsBaseMonth?: string;
    valuationAsOfDate?: string;
  }) => {
    patch.mutate(body, {
      onError: () => {
        /* preferencias locales siguen; el servidor puede fallar sin sesión */
      },
    });
  };

  const setMode = (id: DisplayValuationMode) => {
    setValuation({ displayValuationMode: id });
    pushServer({ displayValuationMode: id });
  };

  return (
    <div className="border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <Scale className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-700">Valuación</span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="text-slate-500 line-clamp-2 sm:line-clamp-1">
            {valuationModeFootnote(displayValuationMode)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  displayValuationMode === m.id
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="font-medium whitespace-nowrap">FX asOf</span>
            <input
              type="date"
              value={valuationAsOfDate}
              onChange={(e) => {
                const v = e.target.value;
                setValuation({ valuationAsOfDate: v });
                pushServer({ valuationAsOfDate: v });
              }}
              className="border border-slate-200 rounded-md px-1.5 py-1 text-[11px] font-mono bg-white"
            />
          </label>

          {displayValuationMode === 'REAL_COP' ? (
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="font-medium whitespace-nowrap">Base IPC</span>
              <input
                type="month"
                value={realTermsBaseMonth.slice(0, 7)}
                onChange={(e) => {
                  const v = `${e.target.value}-01`;
                  setValuation({ realTermsBaseMonth: v });
                  pushServer({ realTermsBaseMonth: v });
                }}
                className="border border-slate-200 rounded-md px-1.5 py-1 text-[11px] font-mono bg-white"
              />
            </label>
          ) : null}

          {patch.isPending ? (
            <span className="text-[10px] text-slate-400">Guardando…</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
