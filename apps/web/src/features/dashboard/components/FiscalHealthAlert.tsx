import React from 'react';
import { AlertTriangle, Landmark } from 'lucide-react';
import type { FinancialConfidence } from '@personal-finance-os/explanation';

export function FiscalHealthAlert({
  scenariosReady,
  confidence,
}: {
  scenariosReady: boolean;
  confidence?: FinancialConfidence | null;
}) {
  const low = confidence?.level === 'LOW';
  const reasons = confidence?.reasons?.slice(0, 2) ?? [];

  if (!scenariosReady) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex gap-2">
        <Landmark className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-[11px] font-semibold text-slate-800">Fiscal</p>
          <p className="text-[10px] text-slate-600 leading-snug mt-0.5">
            No hay escenarios comparables aún. Completá perfil y generá un plan en Fiscal para ver
            alertas y estimaciones de carga.
          </p>
        </div>
      </div>
    );
  }

  if (low) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 flex gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-[11px] font-semibold text-amber-950">Alerta fiscal: datos incompletos</p>
          <ul className="text-[10px] text-amber-900/90 mt-1 space-y-0.5 list-disc pl-4">
            {reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 flex gap-2">
      <Landmark className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="text-[11px] font-semibold text-emerald-950">Fiscal en línea</p>
        <p className="text-[10px] text-emerald-900/80 leading-snug mt-0.5">
          Escenarios disponibles con nivel de confianza{' '}
          {confidence?.level === 'HIGH' ? 'alto' : 'medio'}. Revisá supuestos en la vista Fiscal.
        </p>
      </div>
    </div>
  );
}
