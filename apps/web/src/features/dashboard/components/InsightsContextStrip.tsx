'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { InsightModule, ProductInsight } from '../types/productInsights';

export type InsightsContextStripProps = {
  insights: ProductInsight[] | undefined;
  /** Mostrar solo insights de estos módulos (y `global` si includeGlobal). */
  modules: InsightModule[];
  /** Incluir insights con módulo `global` (p. ej. tendencia de flujo). */
  includeGlobal?: boolean;
  max?: number;
  loading?: boolean;
};

export function InsightsContextStrip({
  insights,
  modules,
  includeGlobal = true,
  max = 2,
  loading,
}: InsightsContextStripProps) {
  const filtered = useMemo(() => {
    if (!insights?.length) return [];
    const allow = new Set<InsightModule>(modules);
    if (includeGlobal) allow.add('global');
    return insights.filter((i) => allow.has(i.module)).slice(0, max);
  }, [insights, modules, includeGlobal, max]);

  if (loading) {
    return (
      <div className="h-12 rounded-lg bg-slate-100 animate-pulse mb-4 border border-slate-200/60" />
    );
  }

  if (!filtered.length) return null;

  return (
    <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden />
        <span className="text-[11px] font-bold text-indigo-950">Para esta vista</span>
        <Link href="/" className="ml-auto text-[10px] font-semibold text-indigo-700 hover:underline">
          Ver todas en inicio
        </Link>
      </div>
      <ul className="space-y-1.5">
        {filtered.map((i) => (
          <li key={i.id} className="text-[11px] text-indigo-950/90 leading-snug">
            <Link href={i.href} className="font-medium hover:underline">
              {i.title}
            </Link>
            <span className="text-indigo-900/80"> — {i.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
