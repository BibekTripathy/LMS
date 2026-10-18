import { isAxiosError } from 'axios';

/**
 * Turn any thrown value (usually an Axios error from our API) into a readable message.
 * Understands the backend's `{ error, code, details }` format and DRF's `{ detail }` / field errors.
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError(err)) {
    const data: unknown = err.response?.data;
    if (data && typeof data === 'object') {
      const body = data as Record<string, unknown>;
      if (typeof body.error === 'string') return body.error;
      if (typeof body.detail === 'string') return body.detail;
      const firstField = Object.values(body).find((v) => Array.isArray(v) && typeof v[0] === 'string');
      if (Array.isArray(firstField)) return String(firstField[0]);
    }
    if (!err.response) return 'Cannot reach the server. Check your connection and try again.';
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** The backend's machine-readable error code, if any. */
export function getErrorCode(err: unknown): string | undefined {
  if (isAxiosError(err)) {
    const data: unknown = err.response?.data;
    if (data && typeof data === 'object' && typeof (data as { code?: unknown }).code === 'string') {
      return (data as { code: string }).code;
    }
  }
  return undefined;
}
