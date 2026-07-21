"use client";

import {
  Download,
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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
  DocumentRecord,
  DocumentType,
} from "@/types/document";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

function formatSize(sizeBytes: number, locale: string): string {
  if (sizeBytes < 1024 * 1024) {
    return new Intl.NumberFormat(locale, { style: "unit", unit: "kilobyte", unitDisplay: "short", maximumFractionDigits: 0 }).format(sizeBytes / 1024);
  }
  return new Intl.NumberFormat(locale, { style: "unit", unit: "megabyte", unitDisplay: "short", maximumFractionDigits: 1 }).format(sizeBytes / (1024 * 1024));
}

export default function DocumentsPage() {
  const { token } = useAuth();
  const { locale, t } = useI18n();
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    day: "2-digit", month: "short", year: "numeric",
  }), [locale]);

  const [documents, setDocuments] = useState<
    DocumentRecord[]
  >([]);
  const [applications, setApplications] =
    useState<ApplicationRecord[]>([]);
  const [isUploadOpen, setIsUploadOpen] =
    useState(false);
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] =
    useState<DocumentType>("CV");
  const [applicationId, setApplicationId] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);
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

    Promise.all([
      apiRequest<DocumentRecord[]>(
        "/documents",
        {
          token,
        },
      ),
      apiRequest<ApplicationsResponse>(
        "/applications?page=1&limit=100",
        {
          token,
        },
      ),
    ])
      .then(
        ([
          documentsResponse,
          applicationsResponse,
        ]) => {
          if (!isCancelled) {
            setDocuments(documentsResponse);
            setApplications(
              applicationsResponse.data,
            );
            setError(null);
          }
        },
      )
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : t("documents.loadError"),
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
  }, [requestKey, t, token]);

  const applicationsById = useMemo(
    () =>
      new Map(
        applications.map((application) => [
          application.id,
          application,
        ]),
      ),
    [applications],
  );

  function closeUpload() {
    if (isSubmitting) {
      return;
    }

    setIsUploadOpen(false);
    setSelectedFile(null);
    setName("");
    setType("CV");
    setApplicationId("");
    setFormError(null);
  }

  function chooseFile(file: File | null) {
    setSelectedFile(file);

    if (file && !name) {
      setName(
        file.name.replace(/\.pdf$/i, ""),
      );
    }
  }

  async function uploadDocument(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token || !selectedFile) {
      setFormError(
        t("documents.selectPdf"),
      );
      return;
    }

    if (
      selectedFile.type !==
      "application/pdf"
    ) {
      setFormError(
        t("documents.pdfOnly"),
      );
      return;
    }

    if (
      selectedFile.size >
      10 * 1024 * 1024
    ) {
      setFormError(
        t("documents.maxSize"),
      );
      return;
    }

    const formData = new FormData();
    formData.set("file", selectedFile);
    formData.set("name", name.trim());
    formData.set("type", type);

    if (applicationId) {
      formData.set(
        "applicationId",
        applicationId,
      );
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await apiRequest<DocumentRecord>(
        "/documents",
        {
          method: "POST",
          token,
          body: formData,
        },
      );

      setIsUploadOpen(false);
      setSelectedFile(null);
      setName("");
      setType("CV");
      setApplicationId("");
      setIsLoading(true);
      setRequestKey((current) => current + 1);
    } catch (caughtError: unknown) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : t("documents.uploadError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function downloadDocument(
    document: DocumentRecord,
  ) {
    if (!token || !API_URL) {
      return;
    }

    setDownloadingId(document.id);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/documents/${document.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          t("documents.downloadError"),
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link =
        window.document.createElement("a");

      link.href = url;
      link.download = document.name;
      link.click();

      URL.revokeObjectURL(url);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("documents.downloadError"),
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function deleteDocument(
    document: DocumentRecord,
  ) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      t("documents.deleteConfirm", { name: document.name }),
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(
        `/documents/${document.id}`,
        {
          method: "DELETE",
          token,
        },
      );

      setDocuments((current) =>
        current.filter(
          (item) => item.id !== document.id,
        ),
      );
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("documents.deleteError"),
      );
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {t("documents.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {t("documents.subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Upload className="size-4" />
            {t("documents.add")}
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-2xl bg-white"
                />
              ),
            )}
          </div>
        ) : documents.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <FileText className="size-6" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              {t("documents.empty")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {t("documents.emptyHint")}
            </p>
            <button
              type="button"
              onClick={() =>
                setIsUploadOpen(true)
              }
              className="mt-6 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {t("documents.addFirst")}
            </button>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((document) => (
              <article
                key={document.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FileText className="size-5" />
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {t(`documentType.${document.type}`)}
                  </span>
                </div>

                <h2 className="mt-5 truncate font-semibold text-slate-950">
                  {document.name}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {formatSize(document.sizeBytes, locale)} ·{" "}
                  {dateFormatter.format(
                    new Date(document.createdAt),
                  )}
                </p>

                <div className="mt-4 min-h-10 text-xs text-slate-500">
                  {document.applications.length >
                  0 ? (
                    document.applications.map(
                      (attachment) => {
                        const application =
                          applicationsById.get(
                            attachment.applicationId,
                          );

                        return (
                          <p
                            key={
                              attachment.applicationId
                            }
                            className="truncate"
                          >
                            {t("documents.associated", { name: application ? `${application.company.name} — ${application.jobTitle}` : t("documents.anApplication") })}
                          </p>
                        );
                      },
                    )
                  ) : (
                    <p>{t("common.notAssociated")}</p>
                  )}
                </div>

                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    disabled={
                      downloadingId === document.id
                    }
                    onClick={() =>
                      void downloadDocument(
                        document,
                      )
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Download className="size-4" />
                    {t("documents.download")}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void deleteDocument(document)
                    }
                    className="flex size-10 items-center justify-center rounded-xl border border-slate-300 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    aria-label={`${t("common.delete")} ${document.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {isUploadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="upload-title"
                  className="text-lg font-semibold text-slate-950"
                >
                  {t("documents.uploadTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("documents.uploadHint")}
                </p>
              </div>

              <button
                type="button"
                onClick={closeUpload}
                className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label={t("common.close")}
              >
                <X className="size-5" />
              </button>
            </header>

            <form
              onSubmit={uploadDocument}
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

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
                <Upload className="size-7 text-indigo-600" />
                <span className="mt-3 text-sm font-semibold text-slate-800">
                  {selectedFile
                    ? selectedFile.name
                    : t("documents.choosePdf")}
                </span>
                {selectedFile && (
                  <span className="mt-1 text-xs text-slate-500">
                    {formatSize(selectedFile.size, locale)}
                  </span>
                )}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  className="sr-only"
                  onChange={(event) =>
                    chooseFile(
                      event.target.files?.[0] ??
                        null,
                    )
                  }
                />
              </label>

              <div>
                <label
                  htmlFor="documentName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {t("documents.name")}
                </label>
                <input
                  id="documentName"
                  required
                  maxLength={255}
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="documentType"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {t("documents.type")}
                  </label>
                  <select
                    id="documentType"
                    value={type}
                    onChange={(event) =>
                      setType(
                        event.target
                          .value as DocumentType,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    {(["CV", "COVER_LETTER", "CERTIFICATE", "REFERENCE", "OTHER"] as DocumentType[]).map((value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {t(`documentType.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="documentApplication"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {t("documents.application")}
                  </label>
                  <select
                    id="documentApplication"
                    value={applicationId}
                    onChange={(event) =>
                      setApplicationId(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">
                      {t("common.notAssociated")}
                    </option>
                    {applications.map(
                      (application) => (
                        <option
                          key={application.id}
                          value={application.id}
                        >
                          {
                            application.company
                              .name
                          }{" "}
                          — {application.jobTitle}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <footer className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeUpload}
                  className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !selectedFile ||
                    !name.trim()
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Plus className="size-4" />
                  {isSubmitting
                    ? t("documents.uploading")
                    : t("common.add")}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
