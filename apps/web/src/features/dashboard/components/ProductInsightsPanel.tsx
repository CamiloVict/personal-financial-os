'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Lightbulb, ChevronRight } from 'lucide-react';
import type { InsightModule, ProductInsight } from '../types/productInsights';

const severityStyles = {
  info: 'border-slate-200 bg-white/90',
  attention: 'border-amber-200 bg-amber-50/80',
  warning: 'border-rose-200 bg-rose-50/85',
};

export type ProductInsightsPanelProps = {
  insights: ProductInsight[] | undefined;
  loading?: boolean;
  maxItems?: number;
};

export function ProductInsightsPanel({
  insights,
  loading,
  maxItems = 10,
}: ProductInsightsPanelProps) {
  const rows = useMemo(() => {
    if (!insights?.length) return [];
    return insights.slice(0, maxItems);
  }, [insights, maxItems]);

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-16 bg-slate-100 rounded-lg" />
          <div className="h-16 bg-slate-100 rounded-lg" />
        </div>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 text-center">
        <p className="text-xs text-slate-600">
          No hay alertas prioritarias con los datos actuales. Sigue registrando flujos y metas para
          activar recomendaciones.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-indigo-200/60 bg-gradient-to-b from-white to-indigo-50/30 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-indigo-100/80">
        <div className="p-1.5 rounded-lg bg-indigo-100">
          <Lightbulb className="w-4 h-4 text-indigo-700" aria-hidden />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recomendaciones</h2>
          <p className="text-[10px] text-slate-500">
            Priorizadas y acotadas para evitar ruido; cada una indica la regla que la disparó.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-slate-100/90">
        {rows.map((i) => (
          <li key={i.id} className="p-4">
            <InsightCard insight={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function moduleLabel(m: InsightModule): string {
  switch (m) {
    case 'cashflow':
      return 'Flujo';
    case 'goals':
      return 'Metas';
    case 'investments':
      return 'Inversiones';
    case 'tax':
      return 'Fiscal';
    case 'debts':
      return 'Deudas';
    default:
      return 'General';
  }
}

function InsightCard({ insight }: { insight: ProductInsight }) {
  const sev = severityStyles[insight.severity];
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${sev}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-slate-900 leading-snug">{insight.title}</h3>
        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500 shrink-0">
          {moduleLabel(insight.module)}
        </span>
      </div>
      <p className="text-[11px] text-slate-700 leading-relaxed mb-2">{insight.detail}</p>
      {insight.action ? (
        <p className="text-[10px] text-slate-800 leading-snug border-l-2 border-indigo-200 bg-indigo-50/50 pl-2 py-1 rounded-r mb-2">
          <span className="font-semibold text-indigo-900">Acción sugerida:</span> {insight.action}
        </p>
      ) : null}
      <p className="text-[10px] text-slate-500 leading-snug border-l-2 border-slate-200 pl-2 mb-2">
        <span className="font-medium text-slate-600">Por qué aparece:</span> {insight.why}
      </p>
      <Link
        href={insight.href}
        className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
      >
        Ir al módulo
        <ChevronRight className="w-3.5 h-3.5" aria-hidden />
      </Link>
    </div>
  );
}
