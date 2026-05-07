// Tiny fetch wrapper around the backend's /api/v1/* surface.
//
// Reads the same VITE_API_BASE_URL the RTK Query baseApi does. The
// backend normalizes responses to { data: T } / { error: { code, message } }
// — http() unwraps `data` on 2xx and throws a structured Error on 4xx/5xx.

const RAW = (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL?.trim().replace(/\/$/, '') || '';
const BASE = !RAW
  ? '/api/v1'
  : /\/api\/v\d+$/.test(RAW)
  ? RAW
  : `${RAW}/api/v1`;

function getStoredToken(): string | null {
  try {
    return localStorage.getItem('dentflow_access_token');
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

  const res = await fetch(buildUrl(path, options.params), { method, headers, body });
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string } })?.error;
    const e = new Error(err?.message || `Request failed (${res.status})`) as Error & {
      status?: number;
      code?: string;
    };
    e.status = res.status;
    e.code = err?.code;
    throw e;
  }
  return ((json as { data?: T })?.data ?? (json as T));
}
