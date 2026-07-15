// Centralized error model for the API client.
//
// The backend normalizes failures to:
//   { error: { code: string, message: string, details?: unknown } }
//
// Validation errors (HTTP 400, code "VALIDATION") use Zod's `flatten()` shape:
//   details = { formErrors: string[], fieldErrors: Record<string, string[]> }
//
// http() throws an `ApiError` so callers can branch on `status` / `code` and
// the toast layer can render a precise message instead of "Network error".

export interface ZodFlattened {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(opts: { status: number; code: string; message: string; details?: unknown }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }

  get isValidation(): boolean {
    return this.code === 'VALIDATION' || this.status === 400;
  }
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isNotFound(): boolean {
    return this.status === 404;
  }
  get isServer(): boolean {
    return this.status >= 500;
  }

  /** Zod field errors, when the backend produced a validation flatten payload. */
  fieldErrors(): Record<string, string[]> | null {
    const d = this.details as ZodFlattened | undefined;
    if (d && typeof d === 'object' && d.fieldErrors && typeof d.fieldErrors === 'object') {
      return d.fieldErrors;
    }
    return null;
  }

  /** Flat list of "field: message" lines for validation errors (empty if not validation). */
  fieldErrorLines(): string[] {
    const fe = this.fieldErrors();
    if (!fe) return [];
    return Object.entries(fe).flatMap(([field, msgs]) =>
      (msgs ?? []).map(m => `${humanizeFieldName(field)}: ${m}`),
    );
  }
}

/** True when an unknown caught value is the network-level "fetch failed" error. */
export class NetworkError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
export function isNetworkError(e: unknown): e is NetworkError {
  return e instanceof NetworkError;
}

/**
 * Produce a `{ title, description }` pair suitable for a toast.
 *
 * - Validation errors get a generic title and a description listing the
 *   specific field issues ("Gender: invalid enum value...").
 * - Network errors get a clear "can't reach server" title.
 * - Everything else falls back to the API message + optional caller fallback.
 */
export function humanizeError(
  err: unknown,
  fallback = 'Something went wrong',
): { title: string; description?: string } {
  if (isApiError(err)) {
    if (err.isValidation) {
      const lines = err.fieldErrorLines();
      return {
        title: lines.length > 0 ? 'Please fix the following' : err.message || fallback,
        description: lines.length > 0 ? lines.join('\n') : undefined,
      };
    }
    if (err.isUnauthorized) return { title: 'Sign in required', description: err.message };
    if (err.isForbidden) return { title: 'Not allowed', description: err.message };
    if (err.isNotFound) return { title: 'Not found', description: err.message };
    if (err.isServer)
      return { title: 'Server error', description: err.message || 'The server failed to respond.' };
    return { title: err.message || fallback };
  }
  if (isNetworkError(err)) {
    return {
      title: 'Cannot reach the server',
      description: 'Check your connection and try again.',
    };
  }
  if (err instanceof Error && err.message) return { title: fallback, description: err.message };
  return { title: fallback };
}

/**
 * Map a thrown error to a `Record<field, message>` for inline form display.
 * Returns `null` when the error isn't a backend validation error — caller
 * should fall back to a toast in that case.
 */
export function mapApiErrorToFormErrors(err: unknown): Record<string, string> | null {
  if (!isApiError(err) || !err.isValidation) return null;
  const fe = err.fieldErrors();
  if (!fe) return null;
  const out: Record<string, string> = {};
  for (const [field, msgs] of Object.entries(fe)) {
    if (msgs && msgs.length > 0) out[field] = msgs[0];
  }
  return Object.keys(out).length > 0 ? out : null;
}

function humanizeFieldName(field: string): string {
  // birthDate -> Birth date, insuranceProvider -> Insurance provider
  const spaced = field.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
