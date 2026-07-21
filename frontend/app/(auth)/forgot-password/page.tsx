"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n/language-provider";
import { apiRequest } from "@/lib/api";
import type { MessageResponse } from "@/types/auth";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      await apiRequest<MessageResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage(t("auth.forgotSuccess"));
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : t("auth.loginError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("auth.forgotTitle")}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{t("auth.forgotText")}</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">{t("auth.email")}</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
        </div>
        <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {isSubmitting ? t("auth.sendingResetLink") : t("auth.sendResetLink")}
        </button>
      </form>
      <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">{t("auth.goToLogin")}</Link>
    </div>
  );
}
