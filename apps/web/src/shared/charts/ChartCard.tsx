'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';

export type ChartCardProps = {
  title: string;
  description?: string;
  chartClassName?: string;
  isLoading?: boolean;
  presentationLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
};

export function ChartCard({
  title,
  description,
  chartClassName = 'h-36 sm:h-40',
  isLoading,
  presentationLoading,
  isEmpty,
  emptyTitle = 'Sin datos',
  emptyDescription = 'Agrega información en el módulo correspondiente para ver el gráfico.',
  children,
  headerRight,
  className = '',
}: ChartCardProps) {
  const loading = Boolean(isLoading || presentationLoading);

  return (
    <div
      className={`chart-surface flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4 ${className}`}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2 sm:mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-[0.8125rem]">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-[10px] leading-snug text-slate-500 sm:text-[11px]">{description}</p>
          ) : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>

      {loading ? (
        <div
          className={`flex min-h-[8rem] w-full items-center justify-center rounded-xl bg-slate-50/80 ${chartClassName}`}
          aria-busy
          aria-label="Cargando gráfico"
        >
          <div className="flex flex-col items-center gap-2">
            <Activity className="h-6 w-6 animate-spin text-slate-300" aria-hidden />
            <span className="text-[10px] font-medium text-slate-400">Cargando…</span>
          </div>
        </div>
      ) : isEmpty ? (
        <div className={`flex min-h-[8rem] items-center ${chartClassName}`}>
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            variant="compact"
            className="w-full border-0 bg-transparent py-6 shadow-none"
          />
        </div>
      ) : (
        <div className={`w-full min-w-0 ${chartClassName}`}>{children}</div>
      )}
    </div>
  );
}
