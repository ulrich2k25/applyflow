"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] =
    useState("");
  const [lastName, setLastName] =
    useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
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

    if (password.length < 12) {
      setError(
        "Le mot de passe doit contenir au moins 12 caractères.",
      );
      return;
    }

    if (password !== passwordConfirmation) {
      setError(
        "Les deux mots de passe ne correspondent pas.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
      });

      router.replace("/dashboard");
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Inscription impossible. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600">
          Commencez gratuitement
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Créez votre espace ApplyFlow
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Centralisez votre recherche d’emploi dès
          votre première candidature.
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Prénom
            </label>

            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              maxLength={100}
              value={firstName}
              onChange={(event) =>
                setFirstName(event.target.value)
              }
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nom
            </label>

            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              maxLength={100}
              value={lastName}
              onChange={(event) =>
                setLastName(event.target.value)
              }
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Adresse e-mail
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
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Mot de passe
          </label>

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="12 caractères minimum"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="passwordConfirmation"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Confirmer le mot de passe
          </label>

          <input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={passwordConfirmation}
            onChange={(event) =>
              setPasswordConfirmation(
                event.target.value,
              )
            }
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Création du compte…"
            : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Se connecter
        </Link>
      </p>
    </>
  );
}