'use client';

/**
 * Navegación por capas (Etapa 2):
 * - Primario: operación / salud financiera.
 * - Planificación: hipótesis de capital y escenarios (dropdown).
 * - Configuración: modelo de tipos de inversión (dropdown).
 * Todas las rutas existentes se conservan.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  PieChart,
  Target,
  Landmark,
  Banknote,
  Network,
  Sparkles,
  Scale,
  Settings2,
  Menu,
  X,
} from 'lucide-react';
import { NavAuth } from '@/shared/ui/NavAuth';
import { NavMenuDropdown, type NavMenuItem } from '@/shared/ui/NavMenuDropdown';

type NavVariant = 'default' | 'allocator' | 'simulator';

type PrimaryNavItem = {
  href: string;
  label: string;
  shortDescription?: string;
  icon: LucideIcon;
  onboarding?: string;
};

/** Día a día: visión, flujos, obligaciones, patrimonio líquido, metas, fiscal. */
const PRIMARY_NAV: PrimaryNavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: Home,
    onboarding: 'nav-dashboard',
  },
  {
    href: '/cashflow',
    label: 'Cashflow',
    shortDescription: 'Ingresos y gastos',
    icon: Banknote,
    onboarding: 'nav-cashflow',
  },
  { href: '/debts', label: 'Deudas', icon: Scale },
  {
    href: '/investment-positions',
    label: 'Portafolio',
    shortDescription: 'Posiciones e inversiones',
    icon: PieChart,
    onboarding: 'nav-portfolio',
  },
  { href: '/goals', label: 'Metas', icon: Target },
  {
    href: '/tax',
    label: 'Fiscal',
    icon: Landmark,
    onboarding: 'nav-tax',
  },
];

const PLANNING_NAV: NavMenuItem[] = [
  {
    href: '/allocator',
    label: 'Asignación',
    shortDescription: 'Simulación de escenarios',
    icon: Network,
    onboarding: undefined,
    variant: 'allocator',
  },
  {
    href: '/simulator',
    label: 'Simulador',
    icon: Sparkles,
    variant: 'simulator',
  },
];

const CONFIG_NAV: NavMenuItem[] = [
  {
    href: '/investment-types',
    label: 'Tipos de inversión',
    shortDescription: 'Fondos, bienes, etc.',
    icon: Settings2,
  },
];

function itemClass(variant: NavVariant | undefined, active: boolean): string {
  const base =
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors';
  if (variant === 'allocator') {
    return `${base} text-fuchsia-700 ${active ? 'bg-fuchsia-50' : 'hover:bg-fuchsia-50/80'}`;
  }
  if (variant === 'simulator') {
    return `${base} text-amber-800 border border-amber-100 ${active ? 'bg-amber-100' : 'bg-amber-50/80 hover:bg-amber-100'}`;
  }
  return `${base} ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`;
}

function desktopPrimaryLinkClass(active: boolean): string {
  return `flex items-center gap-1.5 px-2.5 py-2 text-sm font-semibold rounded-lg transition-colors shrink-0 ${
    active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
  }`;
}

export function AppNavigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const primaryActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 gap-2">
            <div className="flex md:hidden items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="touch-manipulation p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-drawer"
                aria-label="Abrir menú de navegación"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link
                href="/"
                className="font-bold text-slate-900 text-sm truncate tracking-tight"
                onClick={() => setMobileOpen(false)}
              >
                Finance OS
              </Link>
            </div>

            <div className="hidden md:flex flex-1 min-w-0 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-0.5 overflow-x-auto overflow-y-visible no-scrollbar">
                {PRIMARY_NAV.map((item) => {
                  const active = primaryActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-onboarding={item.onboarding}
                      className={desktopPrimaryLinkClass(active)}
                      aria-current={active ? 'page' : undefined}
                      title={item.shortDescription}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="hidden lg:inline">{item.label}</span>
                      <span className="lg:hidden">{item.label.split(' ')[0]}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="flex shrink-0 items-center gap-1 overflow-visible">
                <NavMenuDropdown id="nav-planning" buttonLabel="Planificación" items={PLANNING_NAV} />
                <NavMenuDropdown id="nav-config" buttonLabel="Configuración" items={CONFIG_NAV} />
              </div>
            </div>

            <NavAuth />
          </div>
        </div>
      </nav>

      <div className="md:hidden">
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-60 bg-slate-950/50 backdrop-blur-[2px]"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          id="mobile-nav-drawer"
          className={`fixed top-0 left-0 z-70 h-full w-[min(100%,18rem)] max-w-[85vw] bg-white shadow-2xl flex flex-col border-r border-slate-200 transition-transform duration-200 ease-out md:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
          aria-hidden={!mobileOpen}
          inert={!mobileOpen ? true : undefined}
        >
          <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-100">
            <span className="font-bold text-slate-900">Navegación</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="touch-manipulation p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain p-3 pb-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1 pb-2">
              Resumen y día a día
            </p>
            <ul className="flex flex-col gap-0.5">
              {PRIMARY_NAV.map((item) => {
                const active = primaryActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-onboarding={item.onboarding}
                      className={itemClass(undefined, active)}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0 opacity-90" />
                      <span className="flex flex-col min-w-0">
                        <span>{item.label}</span>
                        {item.shortDescription ? (
                          <span className="text-[11px] font-normal text-slate-500 leading-snug">
                            {item.shortDescription}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-4 pb-2">
              Planificación
            </p>
            <ul className="flex flex-col gap-0.5">
              {PLANNING_NAV.map((item) => {
                const active = primaryActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-onboarding={item.onboarding}
                      className={itemClass(item.variant as NavVariant | undefined, active)}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0 opacity-90" />
                      <span className="flex flex-col min-w-0">
                        <span>{item.label}</span>
                        {item.shortDescription ? (
                          <span className="text-[11px] font-normal text-slate-500 leading-snug">
                            {item.shortDescription}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-4 pb-2">
              Configuración del modelo
            </p>
            <ul className="flex flex-col gap-0.5">
              {CONFIG_NAV.map((item) => {
                const active = primaryActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={itemClass(undefined, active)}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0 opacity-90" />
                      <span className="flex flex-col min-w-0">
                        <span>{item.label}</span>
                        {item.shortDescription ? (
                          <span className="text-[11px] font-normal text-slate-500 leading-snug">
                            {item.shortDescription}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}
