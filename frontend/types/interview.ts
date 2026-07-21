export type InterviewType =
  | "PHONE"
  | "VIDEO"
  | "ON_SITE"
  | "TECHNICAL"
  | "HR"
  | "OTHER";

export type InterviewStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";

export interface Interview {
  id: string;
  applicationId: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  durationMinutes: number | null;
  location: string | null;
  meetingUrl: string | null;
  contactName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  application: {
    id: string;
    jobTitle: string;
    company: {
      id: string;
      name: string;
    };
  };
}