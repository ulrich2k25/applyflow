"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/language-provider";
import { apiRequest } from "@/lib/api";
import type { MessageResponse } from "@/types/auth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    void apiRequest<MessageResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
        {t("auth.verifyTitle")}
      </h1>
      <div
        role="status"
        className={`mt-6 rounded-xl border px-4 py-4 text-sm ${
          status === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {status === "loading" && t("auth.verifying")}
        {status === "success" && t("auth.verifySuccess")}
        {status === "error" && t("auth.verifyError")}
      </div>
      {status !== "loading" && (
        <Link href="/login" className="mt-6 flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700">
          {t("auth.goToLogin")}
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-slate-600">ApplyFlow…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
