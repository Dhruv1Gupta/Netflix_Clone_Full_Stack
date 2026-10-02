import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { DICTIONARIES } from '../i18n';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../i18n/languages';

export const LanguageContext = createContext(null);

const STORAGE_KEY = 'cv_language';

function detectInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && DICTIONARIES[stored]) return stored;
  } catch {
    /* localStorage unavailable (private mode, etc.) — fall through */
  }
  return DEFAULT_LANGUAGE;
}

// Small hand-rolled i18n: a flat key -> string dictionary per language (see
// src/i18n/), no external library. t() falls back to the English string
// (then the raw key) so a missing translation never renders blank.
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLanguage);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const setLanguage = useCallback((code) => {
    if (!DICTIONARIES[code]) return;
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = DICTIONARIES[language] || DICTIONARIES[DEFAULT_LANGUAGE];
      let str = dict[key] ?? DICTIONARIES[DEFAULT_LANGUAGE][key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          str = str.replaceAll(`{${name}}`, value);
        }
      }
      return str;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
