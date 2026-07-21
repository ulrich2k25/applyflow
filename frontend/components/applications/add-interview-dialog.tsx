"use client";

import {
  CalendarPlus,
  X,
} from "lucide-react";
import {
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n/language-provider";
import { apiRequest } from "@/lib/api";
import type { ApplicationInterview } from "@/types/application";
import type { InterviewType } from "@/types/interview";

interface AddInterviewDialogProps {
  applicationId: string;
  onCreated: () => void;
}

interface InterviewForm {
  type: InterviewType;
  scheduledAt: string;
  durationMinutes: string;
  location: string;
  meetingUrl: string;
  contactName: string;
  notes: string;
}

const initialForm: InterviewForm = {
  type: "VIDEO",
  scheduledAt: "",
  durationMinutes: "60",
  location: "",
  meetingUrl: "",
  contactName: "",
  notes: "",
};

export function AddInterviewDialog({
  applicationId,
  onCreated,
}: AddInterviewDialogProps) {
  const { token } = useAuth();
  const { t } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] =
    useState<InterviewForm>(initialForm);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);

  function updateField<K extends keyof InterviewForm>(
    field: K,
    value: InterviewForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function close() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setForm(initialForm);
    setError(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token || !form.scheduledAt) {
      return;
    }

    const payload: {
      type: InterviewType;
      scheduledAt: string;
      durationMinutes?: number;
      location?: string;
      meetingUrl?: string;
      contactName?: string;
      notes?: string;
    } = {
      type: form.type,
      scheduledAt: new Date(
        form.scheduledAt,
      ).toISOString(),
    };

    if (form.durationMinutes) {
      payload.durationMinutes = Number(
        form.durationMinutes,
      );
    }

    if (form.location.trim()) {
      payload.location = form.location.trim();
    }

    if (form.meetingUrl.trim()) {
      payload.meetingUrl =
        form.meetingUrl.trim();
    }

    if (form.contactName.trim()) {
      payload.contactName =
        form.contactName.trim();
    }

    if (form.notes.trim()) {
      payload.notes = form.notes.trim();
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiRequest<ApplicationInterview>(
        `/applications/${applicationId}/interviews`,
        {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        },
      );

      setIsOpen(false);
      setForm(initialForm);
      onCreated();
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("interviewDialog.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
      >
        <CalendarPlus className="size-4" />
        {t("common.add")}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="interview-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2
                  id="interview-dialog-title"
                  className="text-lg font-semibold text-slate-950"
                >
                  {t("interviewDialog.new")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("interviewDialog.subtitle")}
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label={t("common.close")}
              >
                <X className="size-5" />
              </button>
            </header>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
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
                    htmlFor="interviewType"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {t("interviewDialog.type")}
                  </label>
                  <select
                    id="interviewType"
                    value={form.type}
                    onChange={(event) =>
                      updateField(
                        "type",
                        event.target
                          .value as InterviewType,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="PHONE">
                      {t("interviewType.PHONE")}
                    </option>
                    <option value="VIDEO">
                      {t("interviewType.VIDEO")}
                    </option>
                    <option value="ON_SITE">
                      {t("interviewType.ON_SITE")}
                    </option>
                    <option value="TECHNICAL">
                      {t("interviewType.TECHNICAL")}
                    </option>
                    <option value="HR">
                      {t("interviewType.HR")}
                    </option>
                    <option value="CASE_STUDY">
                      {t("interviewType.CASE_STUDY")}
                    </option>
                    <option value="OTHER">
                      {t("interviewType.OTHER")}
                    </option>
                  </select>
                </div>

                <FormField
                  id="scheduledAt"
                  label={t("interviewDialog.dateTime")}
                  type="datetime-local"
                  required
                  value={form.scheduledAt}
                  onChange={(value) =>
                    updateField(
                      "scheduledAt",
                      value,
                    )
                  }
                />

                <FormField
                  id="durationMinutes"
                  label={t("interviewDialog.duration")}
                  type="number"
                  min={1}
                  max={1440}
                  value={form.durationMinutes}
                  onChange={(value) =>
                    updateField(
                      "durationMinutes",
                      value,
                    )
                  }
                />

                <FormField
                  id="location"
                  label={t("interviewDialog.location")}
                  value={form.location}
                  onChange={(value) =>
                    updateField("location", value)
                  }
                  placeholder={t("interviewDialog.locationPlaceholder")}
                />

                <FormField
                  id="meetingUrl"
                  label={t("interviewDialog.meetingUrl")}
                  type="url"
                  value={form.meetingUrl}
                  onChange={(value) =>
                    updateField(
                      "meetingUrl",
                      value,
                    )
                  }
                  placeholder="https://..."
                />

                <FormField
                  id="contactName"
                  label={t("interviewDialog.contact")}
                  value={form.contactName}
                  onChange={(value) =>
                    updateField(
                      "contactName",
                      value,
                    )
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="interviewNotes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {t("interviewDialog.notes")}
                </label>
                <textarea
                  id="interviewNotes"
                  rows={4}
                  maxLength={5000}
                  value={form.notes}
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
                  onClick={close}
                  className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t("common.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !form.scheduledAt
                  }
                  className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting
                    ? t("interviewDialog.scheduling")
                    : t("interviewDialog.schedule")}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
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
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
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
        min={min}
        max={max}
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
