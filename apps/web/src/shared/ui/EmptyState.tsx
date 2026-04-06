'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** Menos padding y texto más pequeño (dentro de charts). */
  variant?: 'default' | 'compact';
  className?: string;
  children?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  variant = 'default',
  className = '',
  children,
}: EmptyStateProps) {
  const isCompact = variant === 'compact';
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/90 bg-slate-50/50 text-center ${isCompact ? 'px-3 py-6' : 'px-4 py-10'} ${className}`}
      role="status"
    >
      <div
        className={`mb-2 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 ${isCompact ? 'p-2' : 'p-3'}`}
        aria-hidden
      >
        {icon ?? <Inbox className={isCompact ? 'h-5 w-5' : 'h-7 w-7'} strokeWidth={1.5} />}
      </div>
      <p
        className={`font-semibold text-slate-700 ${isCompact ? 'text-xs' : 'text-sm'}`}
      >
        {title}
      </p>
      {description ? (
        <p
          className={`mt-1 max-w-sm text-slate-500 ${isCompact ? 'text-[10px] leading-snug' : 'text-xs leading-relaxed'}`}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-3 w-full">{children}</div> : null}
    </div>
  );
}
