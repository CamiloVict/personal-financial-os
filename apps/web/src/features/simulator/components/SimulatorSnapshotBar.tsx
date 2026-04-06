'use client';

import React from 'react';
import { Bookmark, RotateCcw, Trash2 } from 'lucide-react';
import type { ScenarioType } from '../types';
import type { SimulatorSavedLatestResponse } from '../api/queries';

const SCENARIO_LABEL: Record<ScenarioType, string> = {
  PROPERTY: 'Compra vivienda',
  DEBT_VS_INVEST: 'Deuda vs invertir',
  TAX_ADVANTAGED: 'Cuenta fiscal (AFC/FPV)',
  BUSINESS: 'Negocio vs mercado',
  CUSTOM: 'Personalizado',
};

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

interface SimulatorSnapshotBarProps {
  activeScenario: ScenarioType;
  saved: SimulatorSavedLatestResponse;
  savedLoading: boolean;
  hasResult: boolean;
  onSave: () => void;
  onRestore: () => void;
  onForget: () => void;
  isSaving: boolean;
  isForgetting: boolean;
}

export function SimulatorSnapshotBar({
  activeScenario,
  saved,
  savedLoading,
  hasResult,
  onSave,
  onRestore,
  onForget,
  isSaving,
  isForgetting,
}: SimulatorSnapshotBarProps) {
  if (savedLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-[10px] text-slate-500">
        Buscando simulación guardada para esta pestaña…
      </div>
    );
  }

  const hasSaved = Boolean(saved);
  if (!hasSaved && !hasResult) return null;

  return (
    <div className="rounded-lg border border-violet-200/90 bg-violet-50/90 px-2.5 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Bookmark className="w-3.5 h-3.5 text-violet-700 shrink-0 mt-0.5" />
          <div className="text-[10px] text-violet-950 leading-snug min-w-0">
            {hasSaved ? (
              <>
                <p className="font-semibold text-violet-900">
                  Simulación guardada · {SCENARIO_LABEL[activeScenario]}
                </p>
                <p className="text-violet-800/90 mt-0.5">
                  Vence el {formatExpiry(saved!.expiresAt)}
                </p>
              </>
            ) : (
              <p className="font-semibold text-violet-900">
                Guarda este resultado 30 días ({SCENARIO_LABEL[activeScenario]}).
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {hasSaved ? (
            <>
              <button
                type="button"
                onClick={onRestore}
                disabled={isForgetting}
                className="inline-flex items-center gap-0.5 rounded-md bg-white border border-violet-300 px-1.5 py-0.5 text-[9px] font-semibold text-violet-900 hover:bg-violet-100/60 disabled:opacity-50"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Restaurar
              </button>
              <button
                type="button"
                onClick={onForget}
                disabled={isForgetting}
                className="inline-flex items-center gap-0.5 rounded-md border border-violet-200 px-1.5 py-0.5 text-[9px] font-semibold text-violet-800 hover:bg-violet-100/40 disabled:opacity-50"
              >
                <Trash2 className="w-2.5 h-2.5" />
                Quitar
              </button>
            </>
          ) : null}
          {hasResult ? (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-0.5 rounded-md bg-violet-600 text-white px-1.5 py-0.5 text-[9px] font-bold hover:bg-violet-700 disabled:opacity-50"
            >
              {isSaving ? '…' : 'Guardar 30 días'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
