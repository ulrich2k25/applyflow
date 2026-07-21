export const supportedLocales = ["fr", "de", "en"] as const;

export type Locale = (typeof supportedLocales)[number];
export type TranslationDictionary = Record<string, string>;

export const FALLBACK_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "applyflow.locale";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    supportedLocales.includes(value as Locale)
  );
}

export function detectBrowserLocale(
  languages: readonly string[],
): Locale {
  for (const language of languages) {
    const locale = language.toLowerCase().split("-")[0];

    if (isLocale(locale)) {
      return locale;
    }
  }

  return FALLBACK_LOCALE;
}

export function interpolate(
  message: string,
  values?: Record<string, string | number>,
): string {
  if (!values) {
    return message;
  }

  return message.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
