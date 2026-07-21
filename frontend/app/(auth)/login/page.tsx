"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [error, setError] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({
        email,
        password,
      });

      router.replace("/dashboard");
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("auth.loginError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600">
          {t("auth.back")}
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {t("auth.loginTitle")}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            {t("auth.email")}
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="vous@exemple.com"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              {t("auth.password")}
            </label>

            <span className="text-sm text-slate-400">
              {t("auth.passwordHint")}
            </span>
          </div>

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder={t("auth.passwordPlaceholder")}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? t("auth.loggingIn")
            : t("auth.login")}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        {t("auth.noAccount")} {" "}
        <Link
          href="/register"
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          {t("auth.createAccount")}
        </Link>
      </p>
    </>
  );
}
