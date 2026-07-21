"use client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/api";
import type {
  ApplicationStatus,
  DashboardOverview,
} from "@/types/dashboard";

const statusConfig: Array<{
  status: ApplicationStatus;
  label: string;
  color: string;
}> = [
  {
    status: "SAVED",
    label: "Enregistrées",
    color: "bg-slate-400",
  },
  {
    status: "PREPARING",
    label: "En préparation",
    color: "bg-amber-400",
  },
  {
    status: "APPLIED",
    label: "Envoyées",
    color: "bg-blue-500",
  },
  {
    status: "IN_REVIEW",
    label: "En examen",
    color: "bg-violet-500",
  },
  {
    status: "INTERVIEW",
    label: "Entretiens",
    color: "bg-indigo-500",
  },
  {
    status: "OFFER",
    label: "Offres",
    color: "bg-emerald-500",
  },
  {
    status: "ACCEPTED",
    label: "Acceptées",
    color: "bg-green-600",
  },
  {
    status: "REJECTED",
    label: "Refusées",
    color: "bg-red-400",
  },
  {
    status: "WITHDRAWN",
    label: "Retirées",
    color: "bg-slate-600",
  },
];

const statusLabels: Record<
  ApplicationStatus,
  string
> = {
  SAVED: "Enregistrée",
  PREPARING: "En préparation",
  APPLIED: "Envoyée",
  IN_REVIEW: "En examen",
  INTERVIEW: "Entretien",
  OFFER: "Offre reçue",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
  ARCHIVED: "Archivée",
};

const dateFormatter = new Intl.DateTimeFormat(
  "fr-FR",
  {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
);

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [overview, setOverview] =
    useState<DashboardOverview | null>(null);
  const [error, setError] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [requestKey, setRequestKey] =
    useState(0);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    apiRequest<DashboardOverview>(
      "/dashboard",
      {
        token,
      },
    )
      .then((data) => {
        if (!isCancelled) {
          setOverview(data);
          setError(null);
        }
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger le tableau de bord.",
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
  }, [token, requestKey]);

  function retry() {
    setError(null);
    setIsLoading(true);
    setRequestKey((current) => current + 1);
  }

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-64 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-2xl bg-white"
                />
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-950">
            Tableau de bord indisponible
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {error ??
              "Les données n’ont pas pu être chargées."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Candidatures actives",
      value: overview.summary.totalApplications,
      icon: BriefcaseBusiness,
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Entreprises",
      value: overview.summary.totalCompanies,
      icon: Building2,
      color: "bg-sky-50 text-sky-700",
    },
    {
      label: "Prochains entretiens",
      value: overview.summary.upcomingInterviews,
      icon: CalendarDays,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Documents",
      value: overview.summary.totalDocuments,
      icon: FileText,
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  const maxStatusCount = Math.max(
    1,
    ...statusConfig.map(
      ({ status }) =>
        overview.applicationsByStatus[status],
    ),
  );

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Bonjour {user?.firstName},
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Vue d’ensemble
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Voici où en est votre recherche
              aujourd’hui.
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

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div
                  className={`flex size-11 items-center justify-center rounded-xl ${card.color}`}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                  />
                </div>
                <p className="mt-5 text-3xl font-semibold text-slate-950">
                  {card.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {card.label}
                </p>
              </article>
            );
          })}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="font-semibold text-slate-950">
                Pipeline des candidatures
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Répartition par étape actuelle
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {statusConfig.map(
                ({ status, label, color }) => {
                  const count =
                    overview.applicationsByStatus[
                      status
                    ];
                  const width =
                    (count / maxStatusCount) * 100;

                  return (
                    <div key={status}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {label}
                        </span>
                        <span className="font-semibold text-slate-950">
                          {count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="font-semibold text-slate-950">
                Candidatures récentes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vos dernières mises à jour
              </p>
            </div>

            {overview.recentApplications.length ===
            0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">
                  Aucune candidature pour le moment.
                </p>
                <Link
                  href="/applications/new"
                  className="mt-3 inline-block text-sm font-semibold text-indigo-600"
                >
                  Ajouter la première
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {overview.recentApplications.map(
                  (application) => (
                    <Link
                      key={application.id}
                      href={`/applications/${application.id}`}
                      className="block p-5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-950">
                            {application.jobTitle}
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {application.company.name}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {
                            statusLabels[
                              application.status
                            ]
                          }
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        Mis à jour le{" "}
                        {dateFormatter.format(
                          new Date(
                            application.updatedAt,
                          ),
                        )}
                      </p>
                    </Link>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}