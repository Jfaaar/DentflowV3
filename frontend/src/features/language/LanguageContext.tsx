// Compat shim: same `useLanguage()` API as before, but powered by i18next.
//
// Existing callsites do `const { t, language, setLanguage, dir } = useLanguage()`
// — that signature is preserved here. Under the hood we delegate to
// react-i18next's `useTranslation` and i18next's `changeLanguage`.

import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { translations, LanguageCode, languages } from '../../lib/i18n/translations';

// Ensure i18next is initialized before any consumer reads from it.
import '../../shared/i18n';

export type { LanguageCode };

// LanguageProvider used to wrap the app; keep it as a no-op so existing
// providers/AppProviders trees don't break.
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const useLanguage = () => {
  const { t: tRaw, i18n } = useTranslation('common');
  const language = (i18n.language as LanguageCode) || 'en';
  const dir =
    (languages.find((l) => l.code === language)?.dir as 'ltr' | 'rtl') || 'ltr';

  const setLanguage = (lang: LanguageCode) => {
    void i18n.changeLanguage(lang);
  };

  // Preserve the legacy strict typing: `t(key)` accepts a known key from
  // translations.en. The optional second argument carries interpolation values
  // for keys containing {{placeholders}}.
  const t = (
    key: keyof typeof translations['en'],
    vars?: Record<string, string | number>,
  ): string => tRaw(key as string, vars as never) as unknown as string;

  return { language, setLanguage, t, dir };
};
