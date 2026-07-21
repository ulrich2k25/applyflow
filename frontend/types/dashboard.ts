export type ApplicationStatus =
  | "SAVED"
  | "PREPARING"
  | "APPLIED"
  | "IN_REVIEW"
  | "INTERVIEW"
  | "OFFER"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "ARCHIVED";

export type Priority =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

interface CompanySummary {
  id: string;
  name: string;
}

interface RecentApplication {
  id: string;
  jobTitle: string;
  status: ApplicationStatus;
  priority: Priority;
  updatedAt: string;
  company: CompanySummary;
}

interface UpcomingInterview {
  id: string;
  type: string;
  status: "SCHEDULED" | "RESCHEDULED";
  scheduledAt: string;
  durationMinutes: number | null;
  application: {
    id: string;
    jobTitle: string;
    company: CompanySummary;
  };
}

export interface DashboardOverview {
  summary: {
    totalApplications: number;
    totalCompanies: number;
    totalDocuments: number;
    upcomingInterviews: number;
  };
  applicationsByStatus: Record<
    ApplicationStatus,
    number
  >;
  applicationsByPriority: Record<
    Priority,
    number
  >;
  recentApplications: RecentApplication[];
  upcomingInterviews: UpcomingInterview[];
  generatedAt: string;
}