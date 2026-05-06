import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

export interface NormalizedApiError {
  status: number | 'FETCH_ERROR' | 'PARSING_ERROR' | 'CUSTOM_ERROR' | 'TIMEOUT_ERROR' | 'UNKNOWN';
  code?: string;
  message: string;
  details?: unknown;
}

export function isFetchBaseQueryError(err: unknown): err is FetchBaseQueryError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

export function isSerializedError(err: unknown): err is SerializedError {
  return typeof err === 'object' && err !== null && 'message' in err && !('status' in err);
}

export function normalizeApiError(err: unknown): NormalizedApiError {
  if (isFetchBaseQueryError(err)) {
    const data = (err as FetchBaseQueryError).data as
      | { error?: { code?: string; message?: string; details?: unknown } }
      | undefined;
    return {
      status: err.status,
      code: data?.error?.code,
      message: data?.error?.message ?? `Request failed (${String(err.status)})`,
      details: data?.error?.details,
    };
  }
  if (isSerializedError(err)) {
    return {
      status: 'UNKNOWN',
      code: err.code,
      message: err.message ?? 'Unknown error',
    };
  }
  return { status: 'UNKNOWN', message: 'Unknown error' };
}
