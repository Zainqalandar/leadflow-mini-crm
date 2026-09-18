import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = 'wordpress' | 'dashboard';

export interface Lead {
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
}

export interface LoginResponse { token: string; admin: { email: string }; }

export interface LeadInsights {
  totalLeads: number;
  countsByStatus: Record<LeadStatus, number>;
  topLeads: Array<Pick<Lead, '_id' | 'name' | 'email' | 'service' | 'budgetRange' | 'status' | 'source' | 'leadScore' | 'createdAt'>>;
}

export interface LeadsResponse {
  leads: Lead[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class LeadflowApiService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'leadflow-auth-token';
  private readonly apiUrl = this.resolveApiUrl();

  login(email: string, password: string): Observable<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', 'POST', { email, password }, false);
  }

  getInsights(): Observable<LeadInsights> { return this.request<LeadInsights>('/leads/insights'); }
  getLeads(): Observable<LeadsResponse> { return this.request<LeadsResponse>('/leads?limit=100'); }
  getToken(): string | null { return localStorage.getItem(this.tokenKey); }
  setToken(token: string): void { localStorage.setItem(this.tokenKey, token); }
  clearToken(): void { localStorage.removeItem(this.tokenKey); localStorage.removeItem('leadflow-admin-email'); }
  getAdminEmail(): string { return localStorage.getItem('leadflow-admin-email') || 'Admin workspace'; }
  setAdminEmail(email: string): void { localStorage.setItem('leadflow-admin-email', email); }

  private request<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: object, authenticated = true): Observable<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (authenticated && token) headers['Authorization'] = `Bearer ${token}`;
    return this.http.request<T>(method, `${this.apiUrl}${path}`, { body, headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) this.clearToken();
        return throwError(() => new Error(error.error?.message || 'The CRM API could not be reached.'));
      }),
    );
  }

  private resolveApiUrl(): string {
    const hostname = typeof window === 'undefined' ? '' : window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : 'https://leadflow-mini-crm.onrender.com/api';
  }
}
