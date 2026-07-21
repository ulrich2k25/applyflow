"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.8fr)]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.5), transparent 35%), radial-gradient(circle at 80% 75%, rgba(14,165,233,0.3), transparent 40%)",
          }}
        />

        <Link
          href="/"
          className="relative flex items-center gap-3 text-xl font-semibold"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500 font-bold shadow-lg shadow-indigo-950/40">
            A
          </span>
          ApplyFlow
        </Link>

        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            {t("auth.tagline")}
          </p>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            {t("auth.hero")}
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            {t("auth.heroText")}
          </p>
        </div>

        <p className="relative text-sm text-slate-400">
          © 2026 ApplyFlow
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher compact />
          </div>

          <Link
            href="/"
            className="mb-10 flex items-center gap-3 text-lg font-semibold text-slate-950 lg:hidden"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
              A
            </span>
            ApplyFlow
          </Link>

          {children}
        </div>
      </section>
    </main>
  );
}
