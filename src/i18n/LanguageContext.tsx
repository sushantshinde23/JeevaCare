import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LanguageCode, translations } from './translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LANGUAGE_STORAGE_KEY = 'matricare_language_pref';
export const LANGUAGE_TIMESTAMP_KEY = 'matricare_lang_updated_at';

const VALID_LANGUAGES: LanguageCode[] = ['en', 'mr', 'hi'];
const warnedMissingKeys = new Set<string>();

function getInitialLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode;
    if (stored && VALID_LANGUAGES.includes(stored)) {
      return stored;
    }
  } catch {
    // LocalStorage error
  }
  return 'en'; // English default for new users
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);

  // Update document language metadata whenever language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (!VALID_LANGUAGES.includes(lang)) return;
    setLanguageState(lang);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      localStorage.setItem(LANGUAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // LocalStorage write error fallback
    }

    // Also update saved user account if available in localStorage
    try {
      const rawUser = localStorage.getItem('matricare_auth_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        parsed.language = lang;
        localStorage.setItem('matricare_auth_user', JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    const currentDict = translations[language];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }

    // Fallback to English dictionary
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }

    // Fallback provided or key
    if (process.env.NODE_ENV === 'development' && !warnedMissingKeys.has(key)) {
      warnedMissingKeys.add(key);
      console.warn(`[i18n] Missing translation key: "${key}" for language "${language}"`);
    }

    return fallback !== undefined ? fallback : key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
