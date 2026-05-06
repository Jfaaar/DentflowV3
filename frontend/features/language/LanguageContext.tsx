import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, LanguageCode, languages } from '../../lib/i18n/translations';
import { storage } from '../../lib/storage';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof typeof translations['en']) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(storage.getLanguage() as LanguageCode);

  useEffect(() => {
    // Handle RTL for Arabic
    const langConfig = languages.find(l => l.code === language);
    const dir = langConfig?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    
    // Update LocalStorage
    storage.setLanguage(language);
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const dir = languages.find(l => l.code === language)?.dir as 'ltr' | 'rtl' || 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};