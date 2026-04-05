/**
 * Base URL del API NestJS. Configura en `apps/web/.env.local`:
 * NEXT_PUBLIC_API_URL=http://localhost:3001
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function withUserQuery(endpoint: string, userId?: string) {
  if (!userId) return endpoint;
  const sep = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${sep}userId=${encodeURIComponent(userId)}`;
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  post: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  /** GET con filtro opcional por usuario (coincide con query `userId` del API). */
  getForUser: async <T>(endpoint: string, userId: string): Promise<T> => {
    return apiClient.get<T>(withUserQuery(endpoint, userId));
  },
};
