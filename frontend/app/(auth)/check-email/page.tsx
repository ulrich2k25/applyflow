"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useI18n } from "@/components/i18n/language-provider";
import { apiRequest } from "@/lib/api";
import type { MessageResponse } from "@/types/auth";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const email = searchParams.get("email") ?? "";
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function resend() {
    if (!email) return;

    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      await apiRequest<MessageResponse>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage(t("auth.resendSuccess"));
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("auth.registerError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-indigo-600">ApplyFlow</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {t("auth.checkEmailTitle")}
      </h1>
      <p className="mt-4 text-slate-600">
        {t("auth.checkEmailText", { email: email || t("auth.email") })}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        {t("auth.checkEmailHint")}
      </p>

      {message && (
        <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={resend}
        disabled={!email || isSubmitting}
        className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? t("auth.resending") : t("auth.resendVerification")}
      </button>

      <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">
        {t("auth.goToLogin")}
      </Link>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="text-slate-600">ApplyFlow…</div>}>
      <CheckEmailContent />
    </Suspense>
  );
}
