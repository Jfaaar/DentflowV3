// Centralized brand identity. Fall back to clinic_settings.name from the
// API where it's available; use BRAND.NAME elsewhere.
export const BRAND = {
  NAME: 'MediNEEO',
  STORAGE_PREFIX: 'medineeo',
} as const;

export const STORAGE_KEYS = {
  THEME: `${BRAND.STORAGE_PREFIX}_theme`,
  LANGUAGE: `${BRAND.STORAGE_PREFIX}_language`,
  USER: `${BRAND.STORAGE_PREFIX}_user`,
  ACCESS_TOKEN: `${BRAND.STORAGE_PREFIX}_access_token`,
} as const;
