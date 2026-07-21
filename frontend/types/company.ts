export interface Company {
  id: string;
  userId: string;
  name: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyData {
  name: string;
  website?: string;
  industry?: string;
  city?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}