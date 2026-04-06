'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

export type NavMenuItem = {
  href: string;
  label: string;
  shortDescription?: string;
  icon: LucideIcon;
  onboarding?: string;
  variant?: 'default' | 'allocator' | 'simulator';
};

type NavMenuDropdownProps = {
  id: string;
  buttonLabel: string;
  items: NavMenuItem[];
  align?: 'left' | 'right';
};

function childActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function linkClasses(variant: NavMenuItem['variant'], active: boolean): string {
  const base = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors';
  if (variant === 'allocator') {
    return `${base} text-fuchsia-700 ${active ? 'bg-fuchsia-50' : 'hover:bg-fuchsia-50/80'}`;
  }
  if (variant === 'simulator') {
    return `${base} text-amber-800 border border-amber-100/80 ${active ? 'bg-amber-100' : 'bg-amber-50/80 hover:bg-amber-100'}`;
  }
  return `${base} ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`;
}

export function NavMenuDropdown({
  id,
  buttonLabel,
  items,
  align = 'left',
}: NavMenuDropdownProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const groupActive = items.some((item) => childActive(pathname, item.href));

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors border ${
          groupActive
            ? 'bg-slate-100 text-slate-900 border-slate-200'
            : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <span>{buttonLabel}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={`${id}-menu`}
          role="menu"
          aria-labelledby={`${id}-trigger`}
          className={`absolute top-full mt-1 min-w-[12.5rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-[60] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item) => {
            const active = childActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                data-onboarding={item.onboarding}
                onClick={() => setOpen(false)}
                className={linkClasses(item.variant, active)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex flex-col min-w-0">
                  <span>{item.label}</span>
                  {item.shortDescription ? (
                    <span className="text-[11px] font-normal text-slate-500 leading-snug">
                      {item.shortDescription}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
