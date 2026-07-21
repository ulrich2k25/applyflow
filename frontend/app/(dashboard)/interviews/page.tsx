"use client";

import {
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Plus,
  Video,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/api";
import type {
  Interview,
  InterviewStatus,
  InterviewType,
} from "@/types/interview";

type InterviewFilter =
  | "ALL"
  | "UPCOMING"
  | "COMPLETED"
  | "CANCELLED";

const typeLabels: Record<
  InterviewType,
  string
> = {
  PHONE: "Téléphonique",
  VIDEO: "Visioconférence",
  ON_SITE: "Sur site",
  TECHNICAL: "Technique",
  HR: "Ressources humaines",
  OTHER: "Autre",
};

const statusLabels: Record<
  InterviewStatus,
  string
> = {
  SCHEDULED: "Planifié",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  RESCHEDULED: "Replanifié",
};

const statusClasses: Record<
  InterviewStatus,
  string
> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  RESCHEDULED:
    "bg-amber-50 text-amber-700",
  COMPLETED:
    "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const dateFormatter = new Intl.DateTimeFormat(
  "fr-FR",
  {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
);

export default function InterviewsPage() {
  const { token } = useAuth();

  const [interviews, setInterviews] = useState<
    Interview[]
  >([]);
  const [filter, setFilter] =
    useState<InterviewFilter>("ALL");
  const [referenceTime, setReferenceTime] =
    useState(0);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    apiRequest<Interview[]>("/interviews", {
      token,
    })
      .then((data) => {
        if (!isCancelled) {
          setInterviews(data);
          setReferenceTime(Date.now());
          setError(null);
        }
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger les entretiens.",
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
  }, [token]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      if (filter === "COMPLETED") {
        return interview.status === "COMPLETED";
      }

      if (filter === "CANCELLED") {
        return interview.status === "CANCELLED";
      }

      if (filter === "UPCOMING") {
        return (
          new Date(
            interview.scheduledAt,
          ).getTime() >= referenceTime &&
          (interview.status === "SCHEDULED" ||
            interview.status ===
              "RESCHEDULED")
        );
      }

      return true;
    });
  }, [filter, interviews, referenceTime]);

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Entretiens
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Préparez et retrouvez tous vos
              rendez-vous de recrutement.
            </p>
          </div>

          <Link
            href="/applications"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="size-4" />
            Choisir une candidature
          </Link>
        </header>

        <div className="mt-8 flex gap-2 overflow-x-auto">
          {(
            [
              ["ALL", "Tous"],
              ["UPCOMING", "À venir"],
              ["COMPLETED", "Terminés"],
              ["CANCELLED", "Annulés"],
            ] as Array<
              [InterviewFilter, string]
            >
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                filter === value
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse rounded-2xl bg-white"
                />
              ),
            )}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center text-sm text-red-700">
            {error}
          </div>
        ) : filteredInterviews.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <CalendarDays className="size-6" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Aucun entretien dans cette catégorie
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Ouvrez une candidature pour y ajouter
              un entretien.
            </p>
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {filteredInterviews.map(
              (interview) => (
                <article
                  key={interview.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Video className="size-5" />
                        </span>

                        <div>
                          <p className="text-sm font-medium text-indigo-600">
                            {
                              interview.application
                                .company.name
                            }
                          </p>
                          <Link
                            href={`/applications/${interview.application.id}`}
                            className="font-semibold text-slate-950 hover:text-indigo-700"
                          >
                            {
                              interview.application
                                .jobTitle
                            }
                          </Link>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                          <CalendarDays className="size-4 text-slate-400" />
                          {dateFormatter.format(
                            new Date(
                              interview.scheduledAt,
                            ),
                          )}
                        </span>

                        {interview.durationMinutes && (
                          <span className="flex items-center gap-2">
                            <Clock className="size-4 text-slate-400" />
                            {
                              interview.durationMinutes
                            }{" "}
                            minutes
                          </span>
                        )}

                        {interview.location && (
                          <span className="flex items-center gap-2">
                            <MapPin className="size-4 text-slate-400" />
                            {interview.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[interview.status]}`}
                      >
                        {
                          statusLabels[
                            interview.status
                          ]
                        }
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {typeLabels[interview.type]}
                      </span>
                    </div>
                  </div>

                  {(interview.contactName ||
                    interview.notes ||
                    interview.meetingUrl) && (
                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {interview.contactName && (
                          <p>
                            Contact :{" "}
                            <span className="font-medium text-slate-800">
                              {
                                interview.contactName
                              }
                            </span>
                          </p>
                        )}
                        {interview.notes && (
                          <p className="mt-1">
                            {interview.notes}
                          </p>
                        )}
                      </div>

                      {interview.meetingUrl && (
                        <a
                          href={
                            interview.meetingUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          Rejoindre
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                    </div>
                  )}
                </article>
              ),
            )}
          </section>
        )}
      </div>
    </div>
  );
}
