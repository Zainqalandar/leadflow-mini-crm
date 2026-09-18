import api from "./axiosInstance";
import type {
  Lead,
  LeadInput,
  LeadInsights,
  LeadStats,
  LeadStatus,
  LeadsResponse,
  LoginResponse,
} from "../types/api";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", { email, password });
  return response.data;
}

export async function getLeads(params?: {
  q?: string;
  status?: LeadStatus | "";
  page?: number;
  limit?: number;
}): Promise<LeadsResponse> {
  const response = await api.get<LeadsResponse>("/leads", { params });
  return response.data;
}

export async function getLeadStats(): Promise<LeadStats> {
  const response = await api.get<LeadStats>("/leads/stats");
  return response.data;
}

export async function getLead(id: string): Promise<Lead> {
  const response = await api.get<{ lead: Lead }>(`/leads/${id}`);
  return response.data.lead;
}

export async function getLeadInsights(): Promise<LeadInsights> {
  const response = await api.get<LeadInsights>("/leads/insights");
  return response.data;
}

export async function createLead(payload: LeadInput): Promise<Lead> {
  const response = await api.post<{ lead: Lead }>("/leads", payload);
  return response.data.lead;
}

export async function updateLead(id: string, payload: LeadInput): Promise<Lead> {
  const response = await api.put<{ lead: Lead }>(`/leads/${id}`, payload);
  return response.data.lead;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  const response = await api.patch<{ lead: Lead }>(`/leads/${id}/status`, { status });
  return response.data.lead;
}

export async function deleteLead(id: string): Promise<void> {
  await api.delete(`/leads/${id}`);
}
