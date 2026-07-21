"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  detectBrowserLocale,
  FALLBACK_LOCALE,
  interpolate,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n";
import { translations } from "@/lib/translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  useBrowserLocale: () => void;
  t: (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, setCurrentLocale] = useState<Locale>(FALLBACK_LOCALE);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
      const detectedLocale = isLocale(savedLocale)
        ? savedLocale
        : detectBrowserLocale(navigator.languages);

      setCurrentLocale(detectedLocale);
      document.documentElement.lang = detectedLocale;
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
    setCurrentLocale(nextLocale);
  }, []);

  const useBrowserLocale = useCallback(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
    const detectedLocale = detectBrowserLocale(navigator.languages);

    document.documentElement.lang = detectedLocale;
    setCurrentLocale(detectedLocale);
  }, []);

  const t = useCallback(
    (
      key: string,
      values?: Record<string, string | number>,
    ): string => {
      const message =
        translations[locale][key] ??
        translations[FALLBACK_LOCALE][key] ??
        key;

      return interpolate(message, values);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, useBrowserLocale, t }),
    [locale, setLocale, t, useBrowserLocale],
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside LanguageProvider.");
  }

  return context;
}
