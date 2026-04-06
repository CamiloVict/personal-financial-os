'use client';

import { useAuth } from '@clerk/nextjs';
import { useLayoutEffect } from 'react';
import { setApiGetToken } from '@/shared/api/client';

/**
 * Conecta `getToken()` de Clerk con el cliente fetch del API.
 * useLayoutEffect evita que queries hijas disparen fetch sin Authorization en el primer frame útil.
 */
export function ClerkApiBootstrap() {
  const { getToken, isLoaded } = useAuth();

  useLayoutEffect(() => {
    if (!isLoaded) return;
    setApiGetToken(() => getToken());
    return () => setApiGetToken(null);
  }, [isLoaded, getToken]);

  return null;
}
