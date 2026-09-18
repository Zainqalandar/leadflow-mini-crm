export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadSource = "wordpress" | "dashboard";

export type Lead = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  budgetRange: string;
  message: string;
  status: LeadStatus;
  source: LeadSource;
  leadScore: number;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type LeadsResponse = {
  leads: Lead[];
  pagination: Pagination;
};

export type LeadStats = {
  totalLeads: number;
  countsByStatus: Record<LeadStatus, number>;
};

export type LeadInsights = LeadStats & {
  topLeads: Pick<Lead, "_id" | "name" | "email" | "service" | "budgetRange" | "status" | "source" | "leadScore" | "createdAt">[];
};

export type LeadInput = Pick<Lead, "name" | "email" | "phone" | "service" | "budgetRange" | "message">;

export type LoginResponse = {
  token: string;
  admin: { email: string };
};

export type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};
