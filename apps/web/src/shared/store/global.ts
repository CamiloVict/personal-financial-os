import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const envDefaultUserId =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEFAULT_USER_ID
    ? process.env.NEXT_PUBLIC_DEFAULT_USER_ID
    : 'u1';

export type DisplayValuationMode = 'NOMINAL_COP' | 'NOMINAL_USD' | 'REAL_COP';

function todayIsoDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

interface GlobalState {
  currentUserId: string;
  baseCurrency: string;
  displayValuationMode: DisplayValuationMode;
  /** Primer día del mes (YYYY-MM-DD) para términos reales COP */
  realTermsBaseMonth: string;
  /** Fecha de FX única para vistas nominales coherentes */
  valuationAsOfDate: string;
  setUserId: (id: string) => void;
  setValuation: (p: {
    displayValuationMode?: DisplayValuationMode;
    realTermsBaseMonth?: string;
    valuationAsOfDate?: string;
  }) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      currentUserId: envDefaultUserId,
      baseCurrency: 'USD',
      displayValuationMode: 'NOMINAL_COP',
      realTermsBaseMonth: '2020-01-01',
      valuationAsOfDate: todayIsoDate(),
      setUserId: (id: string) => set({ currentUserId: id.trim() || envDefaultUserId }),
      setValuation: (p) => set((s) => ({ ...s, ...p })),
    }),
    {
      name: 'pfo-session',
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        displayValuationMode: s.displayValuationMode,
        realTermsBaseMonth: s.realTermsBaseMonth,
        valuationAsOfDate: s.valuationAsOfDate,
      }),
    },
  ),
);
