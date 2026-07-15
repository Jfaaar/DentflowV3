// Toast helpers built on `sonner`.
//
// Usage:
//   try { await api.patients.update(p) }
//   catch (e) { toastError(e, 'Failed to update patient') }
//
// `toastError` digests the thrown ApiError / NetworkError into a clear
// title + description (validation field errors, network down, 401, etc.)
// instead of a generic alert.

import { toast } from 'sonner';
import { humanizeError } from './errors';

export function toastError(err: unknown, fallback?: string): void {
  const { title, description } = humanizeError(err, fallback);
  toast.error(title, { description, duration: 6000 });
  // Keep the raw error in the console for debugging.
  // eslint-disable-next-line no-console
  console.error(err);
}

export function toastSuccess(title: string, description?: string): void {
  toast.success(title, { description });
}

export function toastInfo(title: string, description?: string): void {
  toast(title, { description });
}

export { toast };
