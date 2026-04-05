'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setApiGetToken } from '@/shared/api/client';

/**
 * Conecta `getToken()` de Clerk con el cliente fetch del API.
 */
export function ClerkApiBootstrap() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setApiGetToken(() => getToken());
    return () => setApiGetToken(null);
  }, [isLoaded, getToken]);

  return null;
}
