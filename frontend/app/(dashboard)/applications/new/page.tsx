"use client";

import {
  ArrowLeft,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/api";
import type {
  ApplicationRecord,
  CreateApplicationData,
  EmploymentType,
  WorkMode,
} from "@/types/application";
import type { Company } from "@/types/company";
import type {
  ApplicationStatus,
  Priority,
} from "@/types/dashboard";

interface ApplicationForm {
  companyId: string;
  jobTitle: string;
  jobUrl: string;
  description: string;
  location: string;
  employmentType: EmploymentType | "";
  workMode: WorkMode | "";
  source: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  status: ApplicationStatus;
  priority: Priority;
  deadline: string;
}

const initialForm: ApplicationForm = {
  companyId: "",
  jobTitle: "",
  jobUrl: "",
  description: "",
  location: "",
  employmentType: "",
  workMode: "",
  source: "",
  salaryMin: "",
  salaryMax: "",
  currency: "EUR",
  status: "SAVED",
  priority: "MEDIUM",
  deadline: "",
};

export default function NewApplicationPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [companies, setCompanies] = useState<
    Company[]
  >([]);
  const [form, setForm] =
    useState<ApplicationForm>(initialForm);
  const [isLoadingCompanies, setIsLoadingCompanies] =
    useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);

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

          if (data.length === 1) {
            setForm((current) => ({
              ...current,
              companyId: data[0]?.id ?? "",
            }));
          }
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
          setIsLoadingCompanies(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [token]);

  function updateField<K extends keyof ApplicationForm>(
    field: K,
    value: ApplicationForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setError(null);

    const salaryMin =
      form.salaryMin === ""
        ? undefined
        : Number(form.salaryMin);
    const salaryMax =
      form.salaryMax === ""
        ? undefined
        : Number(form.salaryMax);

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin > salaryMax
    ) {
      setError(
        "Le salaire minimum ne peut pas dépasser le salaire maximum.",
      );
      return;
    }

    const payload: CreateApplicationData = {
      companyId: form.companyId,
      jobTitle: form.jobTitle.trim(),
      status: form.status,
      priority: form.priority,
    };

    if (form.jobUrl.trim()) {
      payload.jobUrl = form.jobUrl.trim();
    }

    if (form.description.trim()) {
      payload.description =
        form.description.trim();
    }

    if (form.location.trim()) {
      payload.location = form.location.trim();
    }

    if (form.employmentType) {
      payload.employmentType =
        form.employmentType;
    }

    if (form.workMode) {
      payload.workMode = form.workMode;
    }

    if (form.source.trim()) {
      payload.source = form.source.trim();
    }

    if (salaryMin !== undefined) {
      payload.salaryMin = salaryMin;
    }

    if (salaryMax !== undefined) {
      payload.salaryMax = salaryMax;
    }

    if (
      salaryMin !== undefined ||
      salaryMax !== undefined
    ) {
      payload.currency =
        form.currency.trim().toUpperCase();
    }

    if (form.deadline) {
      payload.deadline = form.deadline;
    }

    setIsSubmitting(true);

    try {
      await apiRequest<ApplicationRecord>(
        "/applications",
        {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        },
      );

      router.push("/applications");
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de créer la candidature.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Retour aux candidatures
        </Link>

        <header className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Nouvelle candidature
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enregistrez le poste et organisez son
            suivi dès maintenant.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">
              Poste
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Les informations essentielles de la
              candidature.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="companyId"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Entreprise
                </label>

                <select
                  id="companyId"
                  required
                  disabled={isLoadingCompanies}
                  value={form.companyId}
                  onChange={(event) =>
                    updateField(
                      "companyId",
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {isLoadingCompanies
                      ? "Chargement…"
                      : "Sélectionner une entreprise"}
                  </option>
                  {companies.map((company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ))}
                </select>

                {!isLoadingCompanies &&
                  companies.length === 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      Vous devez d’abord{" "}
                      <Link
                        href="/companies"
                        className="font-semibold underline"
                      >
                        créer une entreprise
                      </Link>
                      .
                    </p>
                  )}
              </div>

              <FormField
                id="jobTitle"
                label="Intitulé du poste"
                required
                value={form.jobTitle}
                onChange={(value) =>
                  updateField("jobTitle", value)
                }
                placeholder="Software Engineer"
              />

              <FormField
                id="location"
                label="Lieu"
                value={form.location}
                onChange={(value) =>
                  updateField("location", value)
                }
                placeholder="Munich"
              />

              <FormField
                id="jobUrl"
                label="Lien vers l’offre"
                type="url"
                value={form.jobUrl}
                onChange={(value) =>
                  updateField("jobUrl", value)
                }
                placeholder="https://..."
              />

              <SelectField
                id="employmentType"
                label="Type de contrat"
                value={form.employmentType}
                onChange={(value) =>
                  updateField(
                    "employmentType",
                    value as EmploymentType | "",
                  )
                }
                options={[
                  ["FULL_TIME", "Temps plein"],
                  ["PART_TIME", "Temps partiel"],
                  ["INTERNSHIP", "Stage"],
                  [
                    "WORKING_STUDENT",
                    "Werkstudent",
                  ],
                  [
                    "APPRENTICESHIP",
                    "Alternance",
                  ],
                  ["FREELANCE", "Freelance"],
                  ["TEMPORARY", "Temporaire"],
                  ["OTHER", "Autre"],
                ]}
              />

              <SelectField
                id="workMode"
                label="Mode de travail"
                value={form.workMode}
                onChange={(value) =>
                  updateField(
                    "workMode",
                    value as WorkMode | "",
                  )
                }
                options={[
                  ["ON_SITE", "Sur site"],
                  ["HYBRID", "Hybride"],
                  ["REMOTE", "À distance"],
                ]}
              />

              <FormField
                id="source"
                label="Source"
                value={form.source}
                onChange={(value) =>
                  updateField("source", value)
                }
                placeholder="LinkedIn, site carrière…"
              />

              <FormField
                id="deadline"
                label="Date limite"
                type="date"
                value={form.deadline}
                onChange={(value) =>
                  updateField("deadline", value)
                }
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description ou informations utiles
              </label>
              <textarea
                id="description"
                rows={5}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">
              Suivi
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <SelectField
                id="status"
                label="Statut initial"
                value={form.status}
                onChange={(value) =>
                  updateField(
                    "status",
                    value as ApplicationStatus,
                  )
                }
                options={[
                  ["SAVED", "Enregistrée"],
                  [
                    "PREPARING",
                    "En préparation",
                  ],
                  ["APPLIED", "Envoyée"],
                  ["IN_REVIEW", "En examen"],
                  ["INTERVIEW", "Entretien"],
                  ["OFFER", "Offre reçue"],
                  ["ACCEPTED", "Acceptée"],
                  ["REJECTED", "Refusée"],
                  ["WITHDRAWN", "Retirée"],
                ]}
              />

              <SelectField
                id="priority"
                label="Priorité"
                value={form.priority}
                onChange={(value) =>
                  updateField(
                    "priority",
                    value as Priority,
                  )
                }
                options={[
                  ["LOW", "Basse"],
                  ["MEDIUM", "Moyenne"],
                  ["HIGH", "Haute"],
                ]}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">
              Rémunération facultative
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <FormField
                id="salaryMin"
                label="Minimum"
                type="number"
                value={form.salaryMin}
                onChange={(value) =>
                  updateField("salaryMin", value)
                }
              />
              <FormField
                id="salaryMax"
                label="Maximum"
                type="number"
                value={form.salaryMax}
                onChange={(value) =>
                  updateField("salaryMax", value)
                }
              />
              <FormField
                id="currency"
                label="Devise"
                value={form.currency}
                maxLength={3}
                onChange={(value) =>
                  updateField(
                    "currency",
                    value.toUpperCase(),
                  )
                }
              />
            </div>
          </section>

          <footer className="flex justify-end gap-3">
            <Link
              href="/applications"
              className="inline-flex h-11 items-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </Link>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                companies.length === 0
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="size-4" />
              {isSubmitting
                ? "Enregistrement…"
                : "Créer la candidature"}
            </button>
          </footer>
        </form>
      </div>
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
  required = false,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
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
        required={required}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-300 px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      >
        <option value="">Non renseigné</option>
        {options.map(([optionValue, label]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}