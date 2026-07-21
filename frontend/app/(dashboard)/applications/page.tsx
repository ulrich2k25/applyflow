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
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n/language-provider";
import { apiRequest } from "@/lib/api";
import type {
  ApplicationRecord,
  ApplicationsResponse,
} from "@/types/application";
import type {
  ApplicationStatus,
  Priority,
} from "@/types/dashboard";

const statusOptions: ApplicationStatus[] = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "IN_REVIEW",
  "INTERVIEW",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

const priorityClasses: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

export default function ApplicationsPage() {
  const { token } = useAuth();
  const { t } = useI18n();

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
              : t("applications.loadError"),
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
    t,
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
              {t("applications.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {t("applications.count", {
                count: total,
              })}
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
            {t("dashboard.newApplication")}
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
                placeholder={t("applications.search")}
                className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </form>

            <select
              aria-label={t("applications.allStatuses")}
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
                {t("applications.allStatuses")}
              </option>
              {statusOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {t(`status.${option}`)}
                </option>
              ))}
            </select>

            <select
              aria-label={t("applications.allPriorities")}
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
                {t("applications.allPriorities")}
              </option>
              <option value="HIGH">{t("priority.HIGH")}</option>
              <option value="MEDIUM">
                {t("priority.MEDIUM")}
              </option>
              <option value="LOW">{t("priority.LOW")}</option>
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
                {t("common.retry")}
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Search className="size-5" />
              </div>
              <h2 className="mt-4 font-semibold text-slate-950">
                {t("applications.empty")}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {t("applications.emptyHint")}
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
                  {t("applications.page", {
                    page,
                    total: totalPages,
                  })}
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
                    aria-label={t("applications.previous")}
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
                    aria-label={t("applications.next")}
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
  const { locale, t } = useI18n();
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

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
          {t(`status.${application.status}`)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 md:block">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[application.priority]}`}
        >
          {t(`priority.${application.priority}`)}
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
