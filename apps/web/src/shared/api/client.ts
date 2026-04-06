/**
 * En el navegador, por defecto las peticiones van a `/api/nest/*` y Next.js las reescribe al NestJS
 * (ver `next.config.js`). Así se evita apuntar por error a :3000 (404 en masa) y se reduce fricción CORS.
 *
 * - Destino del rewrite: `INTERNAL_API_URL` o `NEXT_PUBLIC_API_URL` o `http://127.0.0.1:3001`
 * - Llamada directa al API (sin proxy): `NEXT_PUBLIC_API_DIRECT=true` en `.env.local`
 */

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

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      headers: await authHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return parseJson<T>(response);
  },

  post: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return parseJson<T>(response);
  },

  put: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'PUT',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return parseJson<T>(response);
  },

  patch: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'PATCH',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return parseJson<T>(response);
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return parseJson<T>(response);
  },
};
