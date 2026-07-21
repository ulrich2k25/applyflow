"use client";

import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/api";
import type {
  ApplicationRecord,
  ApplicationsResponse,
} from "@/types/application";
import type {
  ApplicationStatus,
  Priority,
} from "@/types/dashboard";

const statusOptions: Array<{
  value: ApplicationStatus;
  label: string;
}> = [
  { value: "SAVED", label: "Enregistrée" },
  {
    value: "PREPARING",
    label: "En préparation",
  },
  { value: "APPLIED", label: "Envoyée" },
  { value: "IN_REVIEW", label: "En examen" },
  { value: "INTERVIEW", label: "Entretien" },
  { value: "OFFER", label: "Offre reçue" },
  { value: "ACCEPTED", label: "Acceptée" },
  { value: "REJECTED", label: "Refusée" },
  { value: "WITHDRAWN", label: "Retirée" },
];

const priorityLabels: Record<Priority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
};

const priorityClasses: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

const statusLabels = Object.fromEntries(
  statusOptions.map(({ value, label }) => [
    value,
    label,
  ]),
) as Partial<Record<ApplicationStatus, string>>;

const dateFormatter = new Intl.DateTimeFormat(
  "fr-FR",
  {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
);

export default function ApplicationsPage() {
  const { token } = useAuth();

  const [applications, setApplications] =
    useState<ApplicationRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =
    useState(0);
  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    ApplicationStatus | ""
  >("");
  const [priority, setPriority] = useState<
    Priority | ""
  >("");
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] = useState<
    string | null
  >(null);
  const [requestKey, setRequestKey] =
    useState(0);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (search) {
      params.set("search", search);
    }

    if (status) {
      params.set("status", status);
    }

    if (priority) {
      params.set("priority", priority);
    }

    apiRequest<ApplicationsResponse>(
      `/applications?${params.toString()}`,
      {
        token,
      },
    )
      .then((response) => {
        if (!isCancelled) {
          setApplications(response.data);
          setTotal(response.meta.total);
          setTotalPages(
            response.meta.totalPages,
          );
          setError(null);
        }
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger les candidatures.",
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
  }, [
    page,
    priority,
    requestKey,
    search,
    status,
    token,
  ]);

  function submitSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setPage(1);
    setIsLoading(true);
    setSearch(searchInput.trim());
  }

  function changeStatus(
    value: ApplicationStatus | "",
  ) {
    setPage(1);
    setIsLoading(true);
    setStatus(value);
  }

  function changePriority(
    value: Priority | "",
  ) {
    setPage(1);
    setIsLoading(true);
    setPriority(value);
  }

  function retry() {
    setError(null);
    setIsLoading(true);
    setRequestKey((current) => current + 1);
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Candidatures
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {total} candidature
              {total !== 1 ? "s" : ""} active
              {total !== 1 ? "s" : ""}
            </p>
          </div>

          <Link
            href="/applications/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus
              aria-hidden="true"
              className="size-4"
            />
            Nouvelle candidature
          </Link>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[minmax(280px,1fr)_220px_180px]">
            <form
              onSubmit={submitSearch}
              className="relative"
            >
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Rechercher un poste, une entreprise…"
                className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </form>

            <select
              aria-label="Filtrer par statut"
              value={status}
              onChange={(event) =>
                changeStatus(
                  event.target.value as
                    | ApplicationStatus
                    | "",
                )
              }
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">
                Tous les statuts
              </option>
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrer par priorité"
              value={priority}
              onChange={(event) =>
                changePriority(
                  event.target.value as
                    | Priority
                    | "",
                )
              }
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">
                Toutes les priorités
              </option>
              <option value="HIGH">Haute</option>
              <option value="MEDIUM">
                Moyenne
              </option>
              <option value="LOW">Basse</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl bg-slate-100"
                  />
                ),
              )}
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-sm text-red-700">
                {error}
              </p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Réessayer
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Search className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold text-slate-950">
                Aucune candidature trouvée
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Modifiez vos filtres ou ajoutez une
                nouvelle candidature.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                />
              ))}
            </div>
          )}

          {!isLoading &&
            !error &&
            totalPages > 1 && (
              <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                <p className="text-sm text-slate-500">
                  Page {page} sur {totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => {
                      setIsLoading(true);
                      setPage(
                        (current) => current - 1,
                      );
                    }}
                    className="flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => {
                      setIsLoading(true);
                      setPage(
                        (current) => current + 1,
                      );
                    }}
                    className="flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </footer>
            )}
        </section>
      </div>
    </div>
  );
}

function ApplicationRow({
  application,
}: {
  application: ApplicationRecord;
}) {
  return (
    <Link
      href={`/applications/${application.id}`}
      className="grid gap-4 p-5 transition hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_170px_130px_130px] md:items-center"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950">
          {application.jobTitle}
        </p>
        <p className="mt-1 truncate text-sm text-slate-500">
          {application.company.name}
        </p>
        {application.location && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 md:hidden">
            <MapPin className="size-3.5" />
            {application.location}
          </p>
        )}
      </div>

      <div className="hidden text-sm text-slate-500 md:block">
        {application.location ?? "—"}
      </div>

      <div>
        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {statusLabels[application.status] ??
            application.status}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 md:block">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[application.priority]}`}
        >
          {priorityLabels[application.priority]}
        </span>

        <span className="text-xs text-slate-400 md:mt-2 md:block">
          {dateFormatter.format(
            new Date(application.updatedAt),
          )}
        </span>
      </div>
    </Link>
  );
}