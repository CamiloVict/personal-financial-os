/**
 * Base URL del API NestJS. Configura en `apps/web/.env.local`:
 * NEXT_PUBLIC_API_URL=http://localhost:3001
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: await authHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  post: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  put: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
};
