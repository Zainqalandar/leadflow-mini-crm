import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LEAD_STATUSES, Lead, LeadStatus, LeadflowApiService } from './leadflow-api.service';

interface ServiceSummary { name: string; count: number; percentage: number; }

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly api = inject(LeadflowApiService);
  readonly statuses = LEAD_STATUSES;
  readonly statusColors: Record<LeadStatus, string> = { New: '#efb64e', Contacted: '#5aa8f5', Qualified: '#a98bf4', Won: '#53c49a', Lost: '#eb7f88' };

  email = '';
  password = '';
  adminEmail = '';
  loginError = '';
  dashboardError = '';
  loading = false;
  loggingIn = false;
  loggedIn = false;
  lastUpdated = '';
  insights: { totalLeads: number; countsByStatus: Record<LeadStatus, number>; topLeads: Lead[] } = {
    totalLeads: 0, countsByStatus: { New: 0, Contacted: 0, Qualified: 0, Won: 0, Lost: 0 }, topLeads: [],
  };
  leads: Lead[] = [];
  serviceMix: ServiceSummary[] = [];

  ngOnInit(): void {
    if (this.api.getToken()) { this.loggedIn = true; this.adminEmail = this.api.getAdminEmail(); this.loadDashboard(); }
  }

  signIn(): void {
    if (!this.email.trim() || !this.password) return;
    this.loggingIn = true; this.loginError = '';
    this.api.login(this.email.trim(), this.password).subscribe({
      next: (result) => { this.api.setToken(result.token); this.api.setAdminEmail(result.admin.email); this.adminEmail = result.admin.email; this.loggedIn = true; this.password = ''; this.loggingIn = false; this.loadDashboard(); },
      error: (error: Error) => { this.loginError = error.message; this.loggingIn = false; },
    });
  }

  signOut(): void { this.api.clearToken(); this.loggedIn = false; this.email = ''; this.password = ''; this.dashboardError = ''; }
  refresh(): void { this.loadDashboard(); }
  statusCount(status: LeadStatus): number { return this.insights.countsByStatus[status] || 0; }
  statusPercentage(status: LeadStatus): number { return this.insights.totalLeads ? Math.round((this.statusCount(status) / this.insights.totalLeads) * 100) : 0; }
  get qualifiedRate(): number { return this.insights.totalLeads ? Math.round(((this.statusCount('Qualified') + this.statusCount('Won')) / this.insights.totalLeads) * 100) : 0; }
  get averageScore(): number { return this.leads.length ? Math.round(this.leads.reduce((total, lead) => total + lead.leadScore, 0) / this.leads.length) : 0; }
  get highIntentCount(): number { return this.leads.filter((lead) => lead.leadScore >= 80).length; }
  get promisingCount(): number { return this.leads.filter((lead) => lead.leadScore >= 60 && lead.leadScore < 80).length; }
  scoreLabel(score: number): string { return score >= 80 ? 'High intent' : score >= 60 ? 'Promising' : 'Early stage'; }
  formatDate(value: string): string { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)); }
  initials(name: string): string { return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }

  private loadDashboard(): void {
    this.loading = true; this.dashboardError = '';
    forkJoin({ insights: this.api.getInsights(), leads: this.api.getLeads() }).subscribe({
      next: ({ insights, leads }) => { this.insights = { ...insights, topLeads: insights.topLeads as Lead[] }; this.leads = leads.leads; this.serviceMix = this.buildServiceMix(leads.leads); this.lastUpdated = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date()); this.loading = false; },
      error: (error: Error) => { this.dashboardError = error.message; this.loading = false; if (!this.api.getToken()) this.loggedIn = false; },
    });
  }

  private buildServiceMix(leads: Lead[]): ServiceSummary[] {
    const counts = new Map<string, number>();
    leads.forEach((lead) => counts.set(lead.service, (counts.get(lead.service) || 0) + 1));
    return [...counts.entries()].sort(([, first], [, second]) => second - first).slice(0, 4).map(([name, count]) => ({ name, count, percentage: leads.length ? Math.round((count / leads.length) * 100) : 0 }));
  }
}
