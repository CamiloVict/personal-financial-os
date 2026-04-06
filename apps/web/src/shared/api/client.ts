/**
 * En el navegador, por defecto las peticiones van a `/api/nest/*` y Next.js las reescribe al NestJS
 * (ver `next.config.js`). Así se evita apuntar por error a :3000 (404 en masa) y se reduce fricción CORS.
 *
 * - Destino del rewrite: `INTERNAL_API_URL` o `NEXT_PUBLIC_API_URL` o `http://127.0.0.1:3001`
 * - Llamada directa al API (sin proxy): `NEXT_PUBLIC_API_DIRECT=true` en `.env.local`
 */

import { ApiRequestError } from './api-error';

const stripTrailingSlash = (s: string) => s.replace(/\/+$/, '');

function backendBaseForServer(): string {
  return stripTrailingSlash(
    process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:3001',
  );
}

function useBrowserProxy(): boolean {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_API_DIRECT !== 'true';
}

/** Construye la URL final para `fetch` (path debe empezar por `/` recomendado). */
export function buildApiUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (useBrowserProxy()) {
    return `/api/nest${path}`;
  }
  return `${backendBaseForServer()}${path}`;
}

/**
 * Base “lógica” para mostrar en UI (host del Nest), no la URL del proxy.
 * En el cliente con proxy activo sigue siendo el backend real.
 */
export const API_URL = backendBaseForServer();

let getTokenFn: (() => Promise<string | null>) | null = null;

/** Registrado desde `ClerkApiBootstrap` para adjuntar el JWT en cada request. */
export function setApiGetToken(fn: (() => Promise<string | null>) | null) {
  getTokenFn = fn;
}

async function authHeaders(base: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers = { ...base };
  if (getTokenFn) {
    const token = await getTokenFn();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`API Error: respuesta no JSON (${response.status})`);
  }
}

function nestMessageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const m = (body as { message?: unknown }).message;
  if (typeof m === 'string') return m;
  if (Array.isArray(m) && m.every((x) => typeof x === 'string')) {
    return m.join('; ');
  }
  return undefined;
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) return;
  const requestId = response.headers.get('x-request-id') ?? undefined;
  let backendMessage: string | undefined;
  try {
    const text = await response.text();
    if (text) {
      try {
        backendMessage = nestMessageFromBody(JSON.parse(text));
      } catch {
        backendMessage = text.slice(0, 200);
      }
    }
  } catch {
    /* ignore */
  }
  const summary =
    backendMessage ||
    `${response.status} ${response.statusText || 'Error'}`.trim();
  throw new ApiRequestError(`API Error: ${summary}`, {
    status: response.status,
    requestId,
    backendMessage,
  });
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      headers: await authHeaders(),
    });
    await throwIfNotOk(response);
    return parseJson<T>(response);
  },

  post: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    await throwIfNotOk(response);
    return parseJson<T>(response);
  },

  put: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'PUT',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    await throwIfNotOk(response);
    return parseJson<T>(response);
  },

  patch: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'PATCH',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    await throwIfNotOk(response);
    return parseJson<T>(response);
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    await throwIfNotOk(response);
    return parseJson<T>(response);
  },
};
