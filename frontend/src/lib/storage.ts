/**
 * Ephemeral UI / session storage.
 *
 * Phase 2 retired the patients/appointments/invoices/treatments/quotes/
 * inventory/suppliers/prescriptions/radios keys — those entities now live
 * in Supabase (see `lib/services/*`). This file is intentionally kept for:
 *   - the locally-cached `medineeo_user` session shim used during sign-in,
 *   - language preference,
 *   - and other ephemeral UI state (e.g. collapsed-sidebar) that isn't
 *     worth a round-trip.
 */

import { User } from '../types';

const KEYS = {
  USER: 'medineeo_user',
  LANGUAGE: 'medineeo_language',
};

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
    /* ignore quota errors */
  }
};

const safeRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

export const storage = {
  getUser: (): User | null => {
    try {
      const data = safeGet(KEYS.USER);
      return data ? (JSON.parse(data) as User) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: User) => {
    safeSet(KEYS.USER, JSON.stringify(user));
  },
  removeUser: () => {
    safeRemove(KEYS.USER);
  },

  // Language
  getLanguage: (): string => {
    return safeGet(KEYS.LANGUAGE) || 'en';
  },
  setLanguage: (lang: string) => {
    safeSet(KEYS.LANGUAGE, lang);
  },
};
