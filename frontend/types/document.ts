export type DocumentType =
  | "CV"
  | "COVER_LETTER"
  | "CERTIFICATE"
  | "REFERENCE"
  | "OTHER";

export interface DocumentRecord {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  applications: Array<{
    applicationId: string;
    documentId: string;
    attachedAt: string;
  }>;
}