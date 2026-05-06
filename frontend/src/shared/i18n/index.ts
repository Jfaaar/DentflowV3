// i18next initialization. Resources come from the existing
// frontend/src/lib/i18n/translations.ts so callsites that use t('key')
// keep working unchanged. A future cleanup can split the resources into
// per-locale JSON files under shared/i18n/locales/.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations, languages } from '../../lib/i18n/translations';

const resources = Object.fromEntries(
  Object.entries(translations).map(([code, values]) => [code, { common: values }]),
);

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common'],
      supportedLngs: languages.map((l) => l.code),
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        lookupLocalStorage: 'dentflow_language',
        caches: ['localStorage'],
      },
    });
}

// Keep <html dir> in sync with the active language for RTL.
function applyDir(lang: string) {
  const cfg = languages.find((l) => l.code === lang);
  document.documentElement.dir = cfg?.dir || 'ltr';
  document.documentElement.lang = lang;
}

applyDir(i18n.language);
i18n.on('languageChanged', applyDir);

export { i18n };
export default i18n;
