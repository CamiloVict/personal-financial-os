'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export type ErrorStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact';
  className?: string;
  children?: React.ReactNode;
};

/**
 * Estado de error reutilizable (complemento de EmptyState).
 * Usar role="alert" para lectores de pantalla en fallos recuperables.
 */
export function ErrorState({
  title,
  description,
  icon,
  variant = 'default',
  className = '',
  children,
}: ErrorStateProps) {
  const isCompact = variant === 'compact';
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-rose-200/90 bg-rose-50/60 text-center ${isCompact ? 'px-3 py-4' : 'px-4 py-8'} ${className}`}
      role="alert"
    >
      <div
        className={`mb-2 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 ${isCompact ? 'p-2' : 'p-3'}`}
        aria-hidden
      >
        {icon ?? <AlertCircle className={isCompact ? 'h-5 w-5' : 'h-7 w-7'} strokeWidth={1.75} />}
      </div>
      <p className={`font-semibold text-rose-900 ${isCompact ? 'text-xs' : 'text-sm'}`}>{title}</p>
      {description ? (
        <p
          className={`mt-1 max-w-sm text-rose-800/90 ${isCompact ? 'text-[10px] leading-snug' : 'text-xs leading-relaxed'}`}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-3 w-full">{children}</div> : null}
    </div>
  );
}
