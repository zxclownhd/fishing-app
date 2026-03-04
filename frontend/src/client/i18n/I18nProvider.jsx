import { useEffect, useMemo, useState } from "react";
import { I18nContext } from "./I18nContext";
import { getBrowserLocale, supportedLocales, translations } from "./translations";

const LS_KEY = "app_locale";

function getInitialLocale() {
  const stored = localStorage.getItem(LS_KEY);
  if (stored && supportedLocales.includes(stored)) return stored;
  return getBrowserLocale();
}

export default function I18nProvider({ children }) {
  const [locale, setLocale] = useState(getInitialLocale);

  useEffect(() => {
    localStorage.setItem(LS_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useMemo(() => {
    const dict = translations[locale] || translations.en;

    return (key, fallback) => {
      const parts = key.split(".");
      let cur = dict;
      for (const p of parts) {
        cur = cur?.[p];
        if (cur == null) break;
      }
      if (cur != null) return cur;

      let curEn = translations.en;
      for (const p of parts) {
        curEn = curEn?.[p];
        if (curEn == null) break;
      }
      return curEn ?? fallback ?? key;
    };
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}