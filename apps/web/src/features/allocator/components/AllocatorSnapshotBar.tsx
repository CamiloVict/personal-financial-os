'use client';

import React from 'react';
import { Bookmark, RotateCcw, Trash2 } from 'lucide-react';
import type { AllocatorSavedLatestResponse } from '../api/queries';

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

interface AllocatorSnapshotBarProps {
  saved: AllocatorSavedLatestResponse;
  savedLoading: boolean;
  hasPlan: boolean;
  onSave: () => void;
  onRestore: () => void;
  onForget: () => void;
  isSaving: boolean;
  isForgetting: boolean;
}

export function AllocatorSnapshotBar({
  saved,
  savedLoading,
  hasPlan,
  onSave,
  onRestore,
  onForget,
  isSaving,
  isForgetting,
}: AllocatorSnapshotBarProps) {
  if (savedLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-500">
        Comprobando si hay una asignación guardada…
      </div>
    );
  }

  const hasSaved = Boolean(saved);

  if (!hasSaved && !hasPlan) return null;

  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Bookmark className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="min-w-0 text-[11px] text-amber-950 leading-snug">
            {hasSaved ? (
              <>
                <p className="font-semibold text-amber-900">Asignación guardada</p>
                <p className="text-amber-800/90 mt-0.5">
                  Capital modelo (USD libro):{' '}
                  <span className="font-mono">
                    {Number(saved!.plan.availableCapital).toLocaleString('es-CO')}
                  </span>
                  {' · '}
                  Vence el {formatExpiry(saved!.expiresAt)}
                </p>
              </>
            ) : (
              <p className="font-semibold text-amber-900">
                Puedes guardar esta asignación durante 30 días para recuperarla después.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {hasSaved ? (
            <>
              <button
                type="button"
                onClick={onRestore}
                disabled={isForgetting}
                className="inline-flex items-center gap-1 rounded-md bg-white border border-amber-300 px-2 py-1 text-[10px] font-semibold text-amber-900 hover:bg-amber-100/80 disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar
              </button>
              <button
                type="button"
                onClick={onForget}
                disabled={isForgetting}
                className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-transparent px-2 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-100/50 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                Quitar
              </button>
            </>
          ) : null}
          {hasPlan ? (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1 rounded-md bg-amber-600 text-white px-2 py-1 text-[10px] font-bold hover:bg-amber-700 disabled:opacity-50"
            >
              <Bookmark className="w-3 h-3" />
              {isSaving ? 'Guardando…' : 'Guardar 30 días'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
