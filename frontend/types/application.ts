import type {
  ApplicationStatus,
  Priority,
} from "./dashboard";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "INTERNSHIP"
  | "WORKING_STUDENT"
  | "APPRENTICESHIP"
  | "FREELANCE"
  | "TEMPORARY"
  | "OTHER";

export type WorkMode =
  | "ON_SITE"
  | "HYBRID"
  | "REMOTE";

export interface ApplicationCompany {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
}

export interface ApplicationRecord {
  id: string;
  userId: string;
  companyId: string;
  jobTitle: string;
  jobUrl: string | null;
  description: string | null;
  location: string | null;
  employmentType: EmploymentType | null;
  workMode: WorkMode | null;
  source: string | null;
  salaryMin: string | null;
  salaryMax: string | null;
  currency: string | null;
  status: ApplicationStatus;
  priority: Priority;
  deadline: string | null;
  appliedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: ApplicationCompany;
}

export interface ApplicationsResponse {
  data: ApplicationRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateApplicationData {
  companyId: string;
  jobTitle: string;
  jobUrl?: string;
  description?: string;
  location?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  source?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  status?: ApplicationStatus;
  priority?: Priority;
  deadline?: string;
  appliedAt?: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedAt: string;
}

export interface ApplicationInterview {
  id: string;
  applicationId: string;
  type: string;
  status:
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELLED"
    | "RESCHEDULED";
  scheduledAt: string;
  durationMinutes: number | null;
  location: string | null;
  meetingUrl: string | null;
  contactName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationNote {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDocument {
  applicationId: string;
  documentId: string;
  attachedAt: string;
  document: {
    id: string;
    userId: string;
    name: string;
    type:
      | "CV"
      | "COVER_LETTER"
      | "CERTIFICATE"
      | "REFERENCE"
      | "OTHER";
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  };
}

export interface ApplicationDetail
  extends ApplicationRecord {
  statusHistory: ApplicationStatusHistory[];
  interviews: ApplicationInterview[];
  notes: ApplicationNote[];
  documents: ApplicationDocument[];
}