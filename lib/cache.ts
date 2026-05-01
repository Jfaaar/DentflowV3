/**
 * TTL-based read cache backed by localStorage.
 *
 * Use only for read acceleration. Writes always hit Supabase first; on success,
 * invalidate the relevant cache prefix.
 */

const TTL = 5 * 60 * 1000; // 5 minutes

interface Envelope<T> {
  v: T;
  t: number;
}

const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota exceeded — silently drop cache write */
  }
};

const safeRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

export const cache = {
  read<T>(key: string): T | null {
    const raw = safeGet(key);
    if (!raw) return null;
    try {
      const env = JSON.parse(raw) as Envelope<T>;
      if (!env || typeof env.t !== 'number') return null;
      if (Date.now() - env.t > TTL) return null;
      return env.v;
    } catch {
      return null;
    }
  },

  write<T>(key: string, value: T): void {
    const env: Envelope<T> = { v: value, t: Date.now() };
    safeSet(key, JSON.stringify(env));
  },

  invalidate(prefix: string): void {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      keys.forEach(safeRemove);
    } catch {
      /* ignore */
    }
  },
};
