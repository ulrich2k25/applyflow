"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquare,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { AddInterviewDialog } from "@/components/applications/add-interview-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n/language-provider";
import { apiRequest } from "@/lib/api";
import type {
  ApplicationDetail,
  ApplicationNote,
} from "@/types/application";
import type { ApplicationStatus } from "@/types/dashboard";

const statusOptions: ApplicationStatus[] = ["SAVED", "PREPARING", "APPLIED", "IN_REVIEW", "INTERVIEW", "OFFER", "ACCEPTED", "REJECTED", "WITHDRAWN"];

export default function ApplicationDetailPage() {
  const { applicationId } = useParams<{
    applicationId: string;
  }>();
  const router = useRouter();
  const { token } = useAuth();
  const { locale, t } = useI18n();
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric" }), [locale]);
  const dateTimeFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), [locale]);

  const [application, setApplication] =
    useState<ApplicationDetail | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] =
    useState(true);
  const [isUpdating, setIsUpdating] =
    useState(false);
  const [isAddingNote, setIsAddingNote] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);
  const [requestKey, setRequestKey] =
    useState(0);

  useEffect(() => {
    if (!token || !applicationId) {
      return;
    }

    let isCancelled = false;

    apiRequest<ApplicationDetail>(
      `/applications/${applicationId}`,
      {
        token,
      },
    )
      .then((data) => {
        if (!isCancelled) {
          setApplication(data);
          setError(null);
        }
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : t("applicationDetail.loadError"),
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
  }, [applicationId, requestKey, t, token]);

  async function changeStatus(
    status: ApplicationStatus,
  ) {
    if (!token || !application) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await apiRequest(
        `/applications/${application.id}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ status }),
        },
      );

      setRequestKey((current) => current + 1);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("applicationDetail.statusError"),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function addNote(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !token ||
      !application ||
      !newNote.trim()
    ) {
      return;
    }

    setIsAddingNote(true);
    setError(null);

    try {
      await apiRequest<ApplicationNote>(
        `/applications/${application.id}/notes`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            content: newNote.trim(),
          }),
        },
      );

      setNewNote("");
      setRequestKey((current) => current + 1);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("applicationDetail.noteError"),
      );
    } finally {
      setIsAddingNote(false);
    }
  }

  async function archiveApplication() {
    if (!token || !application) {
      return;
    }

    const confirmed = window.confirm(
      t("applicationDetail.archiveConfirm"),
    );

    if (!confirmed) {
      return;
    }

    setIsUpdating(true);

    try {
      await apiRequest(
        `/applications/${application.id}`,
        {
          method: "DELETE",
          token,
        },
      );

      router.push("/applications");
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("applicationDetail.archiveError"),
      );
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-8 w-72 rounded bg-slate-200" />
          <div className="mt-8 h-64 rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
          <p className="text-sm text-red-700">
            {error}
          </p>
          <Link
            href="/applications"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600"
          >
            {t("applicationForm.back")}
          </Link>
        </div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          {t("applicationForm.back")}
        </Link>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <header className="mt-6 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
              <Building2 className="size-4" />
              {application.company.name}
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {application.jobTitle}
            </h1>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              {application.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {application.location}
                </span>
              )}

              {application.deadline && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" />
                  {t("applicationDetail.deadline", { date: dateFormatter.format(
                    new Date(
                      application.deadline,
                    ),
                  ) })}
                </span>
              )}

              {application.jobUrl && (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700"
                >
                  <ExternalLink className="size-4" />
                  {t("applicationDetail.viewOffer")}
                </a>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <select
              aria-label={t("applicationDetail.changeStatus")}
              value={application.status}
              disabled={isUpdating}
              onChange={(event) =>
                void changeStatus(
                  event.target
                    .value as ApplicationStatus,
                )
              }
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              {statusOptions.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {t(`status.${status}`)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                void archiveApplication()
              }
              disabled={isUpdating}
              className="flex size-11 items-center justify-center rounded-xl border border-slate-300 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              aria-label={t("applicationDetail.archive")}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-950">
                {t("applicationDetail.information")}
              </h2>

              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <Detail
                  label={t("applicationDetail.status")}
                  value={t(`status.${application.status}`)}
                />
                <Detail
                  label={t("applicationDetail.priority")}
                  value={t(`priority.${application.priority}`)}
                />
                <Detail
                  label={t("applicationDetail.employment")}
                  value={
                    application.employmentType ? t(`employment.${application.employmentType}`) : t("common.notProvided")
                  }
                />
                <Detail
                  label={t("applicationDetail.workMode")}
                  value={
                    application.workMode ? t(`workMode.${application.workMode}`) : t("common.notProvided")
                  }
                />
                <Detail
                  label={t("applicationDetail.source")}
                  value={
                    application.source ??
                    t("common.notProvided")
                  }
                />
                <Detail
                  label={t("applicationDetail.created")}
                  value={dateFormatter.format(
                    new Date(
                      application.createdAt,
                    ),
                  )}
                />
              </dl>

              {application.description && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-sm font-medium text-slate-500">
                    {t("applicationDetail.description")}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {application.description}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-5 text-indigo-600" />
                  <h2 className="font-semibold text-slate-950">
                    {t("applicationDetail.notes")}
                  </h2>
                </div>

                <form
                  onSubmit={addNote}
                  className="mt-5"
                >
                  <textarea
                    rows={3}
                    maxLength={10000}
                    value={newNote}
                    onChange={(event) =>
                      setNewNote(
                        event.target.value,
                      )
                    }
                    placeholder={`${t("applicationDetail.addNote")}…`}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        isAddingNote ||
                        !newNote.trim()
                      }
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isAddingNote
                        ? t("applicationDetail.adding")
                        : t("applicationDetail.addNote")}
                    </button>
                  </div>
                </form>
              </div>

              {application.notes.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  {t("applicationDetail.noNotes")}
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {application.notes.map((note) => (
                    <article
                      key={note.id}
                      className="p-6"
                    >
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {note.content}
                      </p>
                      <p className="mt-3 text-xs text-slate-400">
                        {dateTimeFormatter.format(
                          new Date(
                            note.createdAt,
                          ),
                        )}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-950">
                {t("applicationDetail.history")}
              </h2>

              <div className="mt-5 space-y-5">
                {application.statusHistory.map(
                  (history) => (
                    <div
                      key={history.id}
                      className="relative border-l-2 border-indigo-100 pl-5"
                    >
                      <span className="absolute -left-[5px] top-1 size-2 rounded-full bg-indigo-500" />
                      <p className="text-sm font-medium text-slate-700">
                        {t(`status.${history.toStatus}`)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {dateTimeFormatter.format(
                          new Date(
                            history.changedAt,
                          ),
                        )}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-5 text-amber-600" />
                  <h2 className="font-semibold text-slate-950">
                    {t("applicationDetail.interviews")}
                  </h2>
                </div>

                <AddInterviewDialog
                  applicationId={application.id}
                  onCreated={() =>
                    setRequestKey(
                      (current) => current + 1,
                    )
                  }
                />
              </div>

              {application.interviews.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  {t("applicationDetail.noInterviews")}
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {application.interviews.map(
                    (interview) => (
                      <article
                        key={interview.id}
                        className="rounded-xl bg-slate-50 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          {t(`interviewType.${interview.type}`)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dateTimeFormatter.format(
                            new Date(
                              interview.scheduledAt,
                            ),
                          )}
                        </p>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-950">
                  {t("applicationDetail.documents")}
                </h2>
              </div>

              {application.documents.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  {t("applicationDetail.noDocuments")}
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {application.documents.map(
                    ({ document }) => (
                      <div
                        key={document.id}
                        className="rounded-xl bg-slate-50 p-4"
                      >
                        <p className="truncate text-sm font-medium text-slate-800">
                          {document.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {Math.round(
                            document.sizeBytes /
                              1024,
                          )}{" "}
                          {t("documents.kilobytes")}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-700">
        {value}
      </dd>
    </div>
  );
}
