// Tiny fetch wrapper around the backend's /api/v1/* surface.
//
// Reads the same VITE_API_BASE_URL the RTK Query baseApi does. The
// backend normalizes responses to { data: T } / { error: { code, message, details? } }
// — http() unwraps `data` on 2xx and throws an `ApiError` (or `NetworkError`)
// on failure so callers and the toast layer can branch on the cause.

import { ApiError, NetworkError } from './errors';

const RAW = (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL?.trim().replace(/\/$/, '') || '';
const BASE = !RAW
  ? '/api/v1'
  : /\/api\/v\d+$/.test(RAW)
  ? RAW
  : `${RAW}/api/v1`;

function getStoredToken(): string | null {
  try {
    return localStorage.getItem('medineeo_access_token');
  } catch {
    return null;
  }
}

function buildUrl(path: string, params?: Record<string, unknown> | object): string {
  const url = new URL(`${BASE}/${path.replace(/^\//, '')}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function http<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: { body?: unknown; params?: Record<string, unknown> | object } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.params), { method, headers, body });
  } catch (cause) {
    // fetch only rejects on network failure / CORS / abort — never on 4xx-5xx.
    throw new NetworkError('Network request failed', cause);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // Non-JSON body (e.g. proxy error page) — surface raw text on errors below.
    }
  }

  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: unknown } })?.error;
    throw new ApiError({
      status: res.status,
      code: err?.code || 'ERROR',
      message: err?.message || (typeof text === 'string' && text) || `Request failed (${res.status})`,
      details: err?.details,
    });
  }
  return ((json as { data?: T })?.data ?? (json as T));
}
