"use client";

import {
  Building2,
  Globe,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/api";
import type {
  Company,
  CreateCompanyData,
} from "@/types/company";

const emptyForm: CreateCompanyData = {
  name: "",
  website: "",
  industry: "",
  city: "",
  country: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
};

function removeEmptyValues(
  data: CreateCompanyData,
): CreateCompanyData {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) =>
        typeof value === "string" &&
        value.trim() !== "",
    ),
  ) as CreateCompanyData;
}

export default function CompaniesPage() {
  const { token } = useAuth();

  const [companies, setCompanies] = useState<
    Company[]
  >([]);
  const [form, setForm] =
    useState<CreateCompanyData>(emptyForm);
  const [isFormOpen, setIsFormOpen] =
    useState(false);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);
  const [formError, setFormError] = useState<
    string | null
  >(null);
  const [requestKey, setRequestKey] =
    useState(0);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    apiRequest<Company[]>("/companies", {
      token,
    })
      .then((data) => {
        if (!isCancelled) {
          setCompanies(data);
          setError(null);
        }
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger les entreprises.",
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [requestKey, token]);

  function updateField(
    field: keyof CreateCompanyData,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function closeForm() {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await apiRequest<Company>("/companies", {
        method: "POST",
        token,
        body: JSON.stringify(
          removeEmptyValues(form),
        ),
      });

      setIsFormOpen(false);
      setForm(emptyForm);
      setIsLoading(true);
      setRequestKey((current) => current + 1);
    } catch (caughtError: unknown) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de créer l’entreprise.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Entreprises
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {companies.length} entreprise
              {companies.length !== 1 ? "s" : ""} dans
              votre espace
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="size-4" />
            Ajouter une entreprise
          </button>
        </header>

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-52 animate-pulse rounded-2xl bg-white"
                />
              ),
            )}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-center text-sm text-red-700">
            {error}
          </div>
        ) : companies.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Building2 className="size-6" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Ajoutez votre première entreprise
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Les entreprises centralisent les postes,
              contacts et candidatures associés.
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-6 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Ajouter une entreprise
            </button>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <article
                key={company.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Building2 className="size-5" />
                  </div>
                  {company.industry && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {company.industry}
                    </span>
                  )}
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-950">
                  {company.name}
                </h2>

                {(company.city ||
                  company.country) && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="size-4" />
                    {[company.city, company.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center gap-2 truncate text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <Globe className="size-4 shrink-0" />
                    {company.website}
                  </a>
                )}

                {company.contactName && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Contact
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {company.contactName}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </div>

      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="company-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2
                  id="company-form-title"
                  className="text-lg font-semibold text-slate-950"
                >
                  Nouvelle entreprise
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seul le nom est obligatoire.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Fermer"
              >
                <X className="size-5" />
              </button>
            </header>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="companyName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Nom de l’entreprise
                </label>
                <input
                  id="companyName"
                  required
                  maxLength={200}
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  id="industry"
                  label="Secteur"
                  value={form.industry ?? ""}
                  onChange={(value) =>
                    updateField("industry", value)
                  }
                />
                <FormField
                  id="website"
                  label="Site web"
                  type="url"
                  placeholder="https://entreprise.com"
                  value={form.website ?? ""}
                  onChange={(value) =>
                    updateField("website", value)
                  }
                />
                <FormField
                  id="city"
                  label="Ville"
                  value={form.city ?? ""}
                  onChange={(value) =>
                    updateField("city", value)
                  }
                />
                <FormField
                  id="country"
                  label="Pays"
                  value={form.country ?? ""}
                  onChange={(value) =>
                    updateField("country", value)
                  }
                />
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Contact facultatif
                </h3>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <FormField
                    id="contactName"
                    label="Nom du contact"
                    value={form.contactName ?? ""}
                    onChange={(value) =>
                      updateField(
                        "contactName",
                        value,
                      )
                    }
                  />
                  <FormField
                    id="contactEmail"
                    label="E-mail du contact"
                    type="email"
                    value={form.contactEmail ?? ""}
                    onChange={(value) =>
                      updateField(
                        "contactEmail",
                        value,
                      )
                    }
                  />
                  <FormField
                    id="contactPhone"
                    label="Téléphone"
                    type="tel"
                    value={form.contactPhone ?? ""}
                    onChange={(value) =>
                      updateField(
                        "contactPhone",
                        value,
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="companyNotes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Notes
                </label>
                <textarea
                  id="companyNotes"
                  rows={4}
                  value={form.notes ?? ""}
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <footer className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Création…"
                    : "Créer l’entreprise"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-300 px-4 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />
    </div>
  );
}