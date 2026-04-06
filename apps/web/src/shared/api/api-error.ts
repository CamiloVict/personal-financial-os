/**
 * Error enriquecido para fallos HTTP del backend (Nest).
 * Incluye `requestId` si el API devolvió `x-request-id` (observabilidad).
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly requestId?: string;
  /** Cuerpo parseado si era JSON con `message` (Nest). */
  readonly backendMessage?: string;

  constructor(
    message: string,
    opts: { status: number; requestId?: string; backendMessage?: string },
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = opts.status;
    this.requestId = opts.requestId;
    this.backendMessage = opts.backendMessage;
  }
}

export function formatApiErrorForUi(err: unknown): string {
  if (err instanceof ApiRequestError) {
    const parts = [err.message];
    if (err.backendMessage && err.backendMessage !== err.message) {
      parts.push(err.backendMessage);
    }
    if (err.requestId) {
      parts.push(`Ref: ${err.requestId}`);
    }
    return parts.filter(Boolean).join(' — ');
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
