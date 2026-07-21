"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n/language-provider";
import { apiRequest } from "@/lib/api";
import type { MessageResponse } from "@/types/auth";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) return setError(t("auth.resetError"));
    if (password.length < 12) return setError(t("auth.passwordTooShort"));
    if (password !== confirmation) return setError(t("auth.passwordMismatch"));

    setIsSubmitting(true);
    try {
      await apiRequest<MessageResponse>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : t("auth.resetError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("auth.resetTitle")}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{t("auth.resetText")}</p>

      {success ? (
        <>
          <div role="status" className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">{t("auth.resetSuccess")}</div>
          <Link href="/login" className="mt-6 flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700">{t("auth.goToLogin")}</Link>
        </>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">{t("auth.newPassword")}</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
          </div>
          <div>
            <label htmlFor="confirmation" className="mb-2 block text-sm font-medium text-slate-700">{t("auth.confirmPassword")}</label>
            <input id="confirmation" type="password" autoComplete="new-password" required minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
          </div>
          <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {isSubmitting ? t("auth.resettingPassword") : t("auth.resetPassword")}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-slate-600">ApplyFlow…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
