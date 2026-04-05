'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Wifi, WifiOff } from 'lucide-react';
import { apiClient, API_URL } from '@/shared/api/client';
import { useGlobalStore } from '@/shared/store/global';

/**
 * Barra compacta para desarrollo: URL del API, estado de conexión y `userId`
 * que el backend usa en `?userId=` (JSON DB local). En producción no se renderiza.
 */
export function DevSessionBar() {
  const queryClient = useQueryClient();
  const { currentUserId, setUserId } = useGlobalStore();
  const [draft, setDraft] = useState(currentUserId);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    setDraft(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    apiClient
      .get<{ status?: string }>('/')
      .then(() => setOk(true))
      .catch(() => setOk(false));
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return null;
  }

  const apply = () => {
    setUserId(draft);
    queryClient.clear();
  };

  const host = API_URL.replace(/^https?:\/\//, '');

  return (
    <div className="border-b border-slate-200 bg-slate-100/95 text-[10px] text-slate-600 px-3 sm:px-4 py-1 flex flex-wrap items-center gap-2 justify-between gap-y-1">
      <div className="flex items-center gap-1.5 min-w-0">
        {ok === true ? (
          <Wifi className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden />
        ) : ok === false ? (
          <WifiOff className="w-3 h-3 text-red-500 shrink-0" aria-hidden />
        ) : null}
        <span className="font-mono truncate" title={API_URL}>
          API {host}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-slate-500 hidden sm:inline">userId</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="border border-slate-300 rounded px-1.5 py-0.5 w-20 sm:w-24 font-mono text-[10px] bg-white"
          aria-label="ID de usuario para el API"
        />
        <button
          type="button"
          onClick={apply}
          className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-semibold hover:bg-slate-700"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
