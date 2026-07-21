"use client";

import { Languages } from "lucide-react";
import { useI18n } from "./language-provider";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-500">
      <Languages aria-hidden="true" className="size-4" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        value={locale}
        onChange={(event) =>
          setLocale(event.target.value as Locale)
        }
        className={`rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
          compact ? "h-9 px-2 text-xs" : "h-10 px-3 text-sm"
        }`}
      >
        <option value="fr">FR</option>
        <option value="de">DE</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
