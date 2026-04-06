'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Layers, AlertTriangle } from 'lucide-react';
import type { NormalizedTaxFinancials } from '@personal-finance-os/tax-engine';

const copFmt = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const DEDUCTION_KIND_LABEL: Record<string, string> = {
  PREPAID_MEDICINE: 'Medicina prepagada',
  HOUSING_INTEREST: 'Intereses vivienda',
  VOLUNTARY_PENSION_CONTRIBUTION: 'Pensión voluntaria (FPV)',
  AFC_CONTRIBUTION: 'AFC',
  OTHER_DEDUCTIBLE: 'Otra deducción (modelo)',
};

const SOURCE_LABEL: Record<string, string> = {
  CASHFLOW_EXPENSE: 'Gasto cashflow',
  DEBT: 'Deuda',
  INVESTMENT: 'Inversión',
  INFERRED_KEYWORD: 'Inferido (texto)',
};

const LIABILITY_KIND_LABEL: Record<string, string> = {
  MORTGAGE: 'Hipoteca',
  OTHER_INSTALLMENT: 'Otro crédito',
};

const TREATMENT_LABEL: Record<string, string> = {
  NONE: 'Sin etiqueta fiscal',
  RENTA_EXENTA_STYLE_AFC: 'Estilo renta exenta (AFC)',
  RENTA_EXENTA_STYLE_PENSION: 'Estilo renta exenta (pensión)',
  FINANCIAL_INCOME_ORDINARY: 'Renta financiera ordinaria',
  REAL_ESTATE_RENTAL: 'Arriendo / inmueble',
  CAPITAL_GAINS_STYLE: 'Plusvalía / capital',
};

function isNormalizedPayload(x: unknown): x is NormalizedTaxFinancials {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    Array.isArray(o.deductions) &&
    Array.isArray(o.credits) &&
    Array.isArray(o.liabilities) &&
    Array.isArray(o.investments) &&
    Array.isArray(o.warnings)
  );
}

export type TaxNormalizationPanelProps = {
  /** Viene de `GET /tax/plan` (`normalizedForTax`) o del último `POST /tax/analyze`. */
  data: unknown | null | undefined;
  /** Texto cuando aún no hay snapshot (plan anterior a migración o sin recalcular). */
  emptyHint?: string;
  /** Presentación según barra global (COP/USD/real); montos del motor en COP. */
  taxFmt?: (id: string, copAmount: number) => string;
  taxPresentationLoading?: boolean;
};

export function TaxNormalizationPanel({
  data,
  emptyHint,
  taxFmt,
  taxPresentationLoading,
}: TaxNormalizationPanelProps) {
  const [open, setOpen] = useState(true);
  const normalized = useMemo(() => (isNormalizedPayload(data) ? data : null), [data]);

  const totals = useMemo(() => {
    if (!normalized) return null;
    const ded = normalized.deductions.reduce((a, l) => a + l.annualAmountCOP, 0);
    const liab = normalized.liabilities.reduce(
      (a, l) => a + l.estimatedAnnualInterestCOP,
      0,
    );
    const cred = normalized.credits.reduce((a, l) => a + l.annualAmountCOP, 0);
    return { ded, liab, cred };
  }, [normalized]);

  const hasContent =
    normalized &&
    (normalized.warnings.length > 0 ||
      normalized.deductions.length > 0 ||
      normalized.liabilities.length > 0 ||
      normalized.investments.length > 0 ||
      normalized.credits.length > 0);

  if (!normalized && !data) {
    return (
      <div className="glass-card rounded-xl border border-slate-200/80 p-4 text-xs text-slate-600">
        <div className="flex items-start gap-2">
          <Layers className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Datos fiscales normalizados</p>
            <p className="mt-1 text-slate-500">
              {emptyHint ??
                'Pulsa Recalcular motor para generar el plan y ver cómo se traducen tus gastos, deudas e inversiones al modelo tributario.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!normalized && data) {
    return (
      <div className="glass-card rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
        <p className="font-semibold">Datos fiscales normalizados</p>
        <p className="mt-1">El servidor devolvió un formato no reconocido; revisa la versión del API.</p>
      </div>
    );
  }

  if (!normalized) return null;

  const line = (id: string, cop: number) =>
    taxFmt ? taxFmt(id, cop) : copFmt.format(cop);

  return (
    <div className="glass-card rounded-xl border border-slate-200/80 overflow-hidden relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Datos fiscales normalizados</p>
            <p className="text-[11px] text-slate-500 truncate">
              Gastos, deudas e inversiones → deducciones, intereses y tratamiento en el motor CO-AG2026
            </p>
          </div>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
          {taxPresentationLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-white/70 text-[11px] font-medium text-slate-500">
              Aplicando valuación…
            </div>
          ) : null}
          {totals && (totals.ded > 0 || totals.liab > 0 || totals.cred > 0) ? (
            <div className="flex flex-wrap gap-3 pt-3 text-[11px]">
              {totals.ded > 0 ? (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                  Deducciones anualizadas:{' '}
                  <strong>{line('tax-norm-total-ded', totals.ded)}</strong>
                </span>
              ) : null}
              {totals.liab > 0 ? (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                  Intereses deuda (estim.):{' '}
                  <strong>{line('tax-norm-total-liab', totals.liab)}</strong>
                </span>
              ) : null}
              {totals.cred > 0 ? (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                  Créditos (modelo): <strong>{line('tax-norm-total-cred', totals.cred)}</strong>
                </span>
              ) : null}
            </div>
          ) : null}

          {!hasContent ? (
            <p className="text-xs text-slate-500 pt-2">
              No hay líneas derivadas de cashflow, deudas ni inversiones. Puedes asignar pistas fiscales a
              categorías de gasto o registrar deudas con tipo hipoteca para enriquecer el modelo.
            </p>
          ) : null}

          {normalized.warnings.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
              <p className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Advertencias del normalizador
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-950">
                {normalized.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {normalized.deductions.length > 0 ? (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                Deducciones (anual COP)
              </h4>
              <ul className="space-y-1.5">
                {normalized.deductions.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap justify-between gap-2 text-xs border-b border-slate-100 pb-1.5 last:border-0"
                  >
                    <span className="text-slate-700 min-w-0">
                      <span className="text-slate-500">
                        {DEDUCTION_KIND_LABEL[d.kind] ?? d.kind}
                      </span>
                      {' · '}
                      <span className="font-medium">{d.label}</span>
                      <span className="text-slate-400 ml-1">
                        ({SOURCE_LABEL[d.source] ?? d.source})
                      </span>
                    </span>
                    <span className="font-mono text-slate-800 shrink-0">
                      {line(`tax-norm-ded-${d.id}`, d.annualAmountCOP)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {normalized.liabilities.length > 0 ? (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                Deudas → interés anual estimado
              </h4>
              <ul className="space-y-1.5">
                {normalized.liabilities.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-wrap justify-between gap-2 text-xs border-b border-slate-100 pb-1.5 last:border-0"
                  >
                    <span className="text-slate-700">
                      {LIABILITY_KIND_LABEL[l.kind] ?? l.kind}: {l.label}
                    </span>
                    <span className="font-mono text-slate-800 shrink-0">
                      {line(`tax-norm-liab-${l.id}`, l.estimatedAnnualInterestCOP)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {normalized.credits.length > 0 ? (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                Créditos tributarios (modelo)
              </h4>
              <ul className="space-y-1.5">
                {normalized.credits.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap justify-between gap-2 text-xs border-b border-slate-100 pb-1.5 last:border-0"
                  >
                    <span className="text-slate-700">{c.label}</span>
                    <span className="font-mono text-slate-800 shrink-0">
                      {line(`tax-norm-cred-${c.id}`, c.annualAmountCOP)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {normalized.investments.length > 0 ? (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                Inversiones → tratamiento orientativo
              </h4>
              <ul className="space-y-2">
                {normalized.investments.map((inv) => (
                  <li key={inv.positionId} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                    <div className="font-medium text-slate-800">
                      {inv.name?.trim() ? inv.name : inv.typeName}
                    </div>
                    <div className="text-slate-500 text-[11px]">{inv.typeName}</div>
                    <div className="mt-1 inline-block rounded bg-indigo-50 text-indigo-900 px-2 py-0.5 text-[10px] font-semibold">
                      {TREATMENT_LABEL[inv.treatment] ?? inv.treatment}
                    </div>
                    {inv.notes ? (
                      <p className="text-[11px] text-slate-500 mt-1">{inv.notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
