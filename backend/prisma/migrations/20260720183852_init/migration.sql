-- CreateEnum
CREATE TYPE "application_status" AS ENUM (
    'SAVED',
    'PREPARING',
    'APPLIED',
    'IN_REVIEW',
    'INTERVIEW',
    'OFFER',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN',
    'ARCHIVED'
);

-- CreateEnum
CREATE TYPE "priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "employment_type" AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'INTERNSHIP',
    'WORKING_STUDENT',
    'APPRENTICESHIP',
    'FREELANCE',
    'TEMPORARY',
    'OTHER'
);

-- CreateEnum
CREATE TYPE "work_mode" AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "interview_type" AS ENUM (
    'PHONE',
    'VIDEO',
    'ON_SITE',
    'TECHNICAL',
    'HR',
    'CASE_STUDY',
    'OTHER'
);

-- CreateEnum
CREATE TYPE "interview_status" AS ENUM (
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
    'RESCHEDULED'
);

-- CreateEnum
CREATE TYPE "document_type" AS ENUM (
    'CV',
    'COVER_LETTER',
    'CERTIFICATE',
    'REFERENCE',
    'OTHER'
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_first_name_not_blank_check"
        CHECK (btrim("first_name") <> ''),
    CONSTRAINT "users_last_name_not_blank_check"
        CHECK (btrim("last_name") <> '')
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "website" VARCHAR(500),
    "industry" VARCHAR(150),
    "city" VARCHAR(150),
    "country" VARCHAR(100),
    "contact_name" VARCHAR(200),
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(50),
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "companies_name_not_blank_check"
        CHECK (btrim("name") <> '')
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "job_title" VARCHAR(200) NOT NULL,
    "job_url" VARCHAR(1000),
    "description" TEXT,
    "location" VARCHAR(200),
    "employment_type" "employment_type",
    "work_mode" "work_mode",
    "source" VARCHAR(150),
    "salary_min" DECIMAL(12,2),
    "salary_max" DECIMAL(12,2),
    "currency" CHAR(3),
    "status" "application_status" NOT NULL DEFAULT 'SAVED',
    "priority" "priority" NOT NULL DEFAULT 'MEDIUM',
    "deadline" DATE,
    "applied_at" TIMESTAMPTZ(3),
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "applications_job_title_not_blank_check"
        CHECK (btrim("job_title") <> ''),
    CONSTRAINT "applications_salary_min_non_negative_check"
        CHECK ("salary_min" IS NULL OR "salary_min" >= 0),
    CONSTRAINT "applications_salary_max_non_negative_check"
        CHECK ("salary_max" IS NULL OR "salary_max" >= 0),
    CONSTRAINT "applications_salary_range_check"
        CHECK (
            "salary_min" IS NULL
            OR "salary_max" IS NULL
            OR "salary_max" >= "salary_min"
        ),
    CONSTRAINT "applications_currency_format_check"
        CHECK ("currency" IS NULL OR "currency" ~ '^[A-Z]{3}$')
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "from_status" "application_status",
    "to_status" "application_status" NOT NULL,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "application_status_history_status_changed_check"
        CHECK ("from_status" IS NULL OR "from_status" <> "to_status")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "type" "interview_type" NOT NULL,
    "status" "interview_status" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMPTZ(3) NOT NULL,
    "duration_minutes" INTEGER,
    "location" VARCHAR(300),
    "meeting_url" VARCHAR(1000),
    "contact_name" VARCHAR(200),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "interviews_duration_positive_check"
        CHECK ("duration_minutes" IS NULL OR "duration_minutes" > 0)
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notes_content_not_blank_check"
        CHECK (btrim("content") <> '')
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "document_type" NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(150) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "documents_size_positive_check"
        CHECK ("size_bytes" > 0)
);

-- CreateTable
CREATE TABLE "application_documents" (
    "application_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "attached_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_documents_pkey"
        PRIMARY KEY ("application_id", "document_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key"
ON "users"("email");

-- CreateIndex
CREATE INDEX "companies_user_id_idx"
ON "companies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_name_key"
ON "companies"("user_id", "name");

-- CreateIndex
CREATE INDEX "applications_user_id_status_idx"
ON "applications"("user_id", "status");

-- CreateIndex
CREATE INDEX "applications_user_id_created_at_idx"
ON "applications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "applications_company_id_idx"
ON "applications"("company_id");

-- CreateIndex
CREATE INDEX "applications_deadline_idx"
ON "applications"("deadline");

-- CreateIndex
CREATE INDEX "application_status_history_application_id_changed_at_idx"
ON "application_status_history"("application_id", "changed_at");

-- CreateIndex
CREATE INDEX "interviews_application_id_scheduled_at_idx"
ON "interviews"("application_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "notes_application_id_created_at_idx"
ON "notes"("application_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storage_key_key"
ON "documents"("storage_key");

-- CreateIndex
CREATE INDEX "documents_user_id_type_idx"
ON "documents"("user_id", "type");

-- AddForeignKey
ALTER TABLE "companies"
ADD CONSTRAINT "companies_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications"
ADD CONSTRAINT "applications_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications"
ADD CONSTRAINT "applications_company_id_fkey"
FOREIGN KEY ("company_id")
REFERENCES "companies"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history"
ADD CONSTRAINT "application_status_history_application_id_fkey"
FOREIGN KEY ("application_id")
REFERENCES "applications"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews"
ADD CONSTRAINT "interviews_application_id_fkey"
FOREIGN KEY ("application_id")
REFERENCES "applications"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes"
ADD CONSTRAINT "notes_application_id_fkey"
FOREIGN KEY ("application_id")
REFERENCES "applications"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents"
ADD CONSTRAINT "documents_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents"
ADD CONSTRAINT "application_documents_application_id_fkey"
FOREIGN KEY ("application_id")
REFERENCES "applications"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents"
ADD CONSTRAINT "application_documents_document_id_fkey"
FOREIGN KEY ("document_id")
REFERENCES "documents"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;