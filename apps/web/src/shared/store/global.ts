import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const envDefaultUserId =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEFAULT_USER_ID
    ? process.env.NEXT_PUBLIC_DEFAULT_USER_ID
    : 'u1';

interface GlobalState {
  currentUserId: string;
  baseCurrency: string;
  setUserId: (id: string) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      currentUserId: envDefaultUserId,
      baseCurrency: 'USD',
      setUserId: (id) => set({ currentUserId: id.trim() || envDefaultUserId }),
    }),
    {
      name: 'pfo-session',
      partialize: (s) => ({ currentUserId: s.currentUserId }),
    },
  ),
);
