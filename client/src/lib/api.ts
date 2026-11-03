/**
 * Minimal API client.
 *
 * Security model:
 *  - The access token is held in memory only (never localStorage), so an XSS
 *    payload can't read a long-lived credential from storage.
 *  - The refresh token lives in an httpOnly cookie the browser sends
 *    automatically; JS never touches it.
 *  - On a 401, the client transparently tries ONE refresh, then retries the
 *    original request. If refresh fails, it clears the token and notifies the
 *    app to send the user back to the login screen.
 */

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Internal: prevents infinite refresh loops. */
  _retry?: boolean;
};

const rawRequest = async (path: string, options: RequestOptions): Promise<Response> => {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include', // send the refresh cookie
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
};

const parse = async (res: Response): Promise<unknown> => {
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

/** Attempt a single refresh. Returns true if a new access token was obtained. */
const tryRefresh = async (): Promise<boolean> => {
  const res = await rawRequest('/auth/refresh', { method: 'POST' });
  if (!res.ok) return false;
  const data = (await parse(res)) as { accessToken?: string } | null;
  if (data?.accessToken) {
    accessToken = data.accessToken;
    return true;
  }
  return false;
};

export const api = async <T = unknown>(path: string, options: RequestOptions = {}): Promise<T> => {
  let res = await rawRequest(path, options);

  if (res.status === 401 && !options._retry && path !== '/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawRequest(path, { ...options, _retry: true });
    } else {
      accessToken = null;
      onUnauthorized?.();
    }
  }

  const data = await parse(res);
  if (!res.ok) {
    const err = (data as { error?: { code: string; message: string; details?: unknown } })?.error;
    throw new ApiError(res.status, err?.code ?? 'error', err?.message ?? 'Request failed', err?.details);
  }
  return data as T;
};
