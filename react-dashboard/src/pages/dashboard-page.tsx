import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2, CircleDot, Plus, Sparkles, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LeadTable, LoadingState } from "../components/lead-ui";
import type { Lead, LeadStats, LeadStatus } from "../types/api";
import { getApiErrorMessage } from "../utils/api-error";
import { getLeads, getLeadStats } from "../utils/leadflow-api";

const pipeline: { status: LeadStatus; label: string }[] = [
  { status: "New", label: "New leads" },
  { status: "Contacted", label: "Contacted" },
  { status: "Qualified", label: "Qualified" },
  { status: "Won", label: "Won" },
  { status: "Lost", label: "Lost" },
];

export function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getLeadStats(), getLeads({ page: 1, limit: 5 })])
      .then(([statsResult, leadsResult]) => {
        if (!active) return;
        setStats(statsResult);
        setRecentLeads(leadsResult.leads);
        setError("");
      })
      .catch((caught) => { if (active) setError(getApiErrorMessage(caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const cards = [
    { label: "Total leads", value: stats?.totalLeads ?? 0, icon: UsersRound, tone: "blue", caption: "All opportunities" },
    { label: "New leads", value: stats?.countsByStatus.New ?? 0, icon: CircleDot, tone: "amber", caption: "Ready for outreach" },
    { label: "Qualified", value: stats?.countsByStatus.Qualified ?? 0, icon: Sparkles, tone: "purple", caption: "High intent prospects" },
    { label: "Won", value: stats?.countsByStatus.Won ?? 0, icon: CheckCircle2, tone: "green", caption: "Successfully closed" },
  ];

  return (
    <div className="page-stack">
      <div className="page-heading"><div><div className="eyebrow">WORKSPACE OVERVIEW</div><h1>{greeting}, Admin <span className="heading-spark">✳</span></h1><p>Here’s what’s happening with your leads today.</p></div><Link to="/leads/new" className="button button-primary"><Plus size={18} /> Add new lead</Link></div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => { setLoading(true); setReload((value) => value + 1); }} /> : <>
        <div className="stats-grid">
          {cards.map(({ label, value, icon: Icon, tone, caption }) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className={`stat-icon tone-${tone}`}><Icon size={21} strokeWidth={1.9} /></span></div><strong>{value.toLocaleString()}</strong><div className="stat-caption"><span className="tiny-arrow"><ArrowUpRight size={13} /></span>{caption}</div></div>)}
        </div>

        <div className="overview-grid">
          <section className="panel pipeline-panel"><div className="panel-heading"><div><h2>Pipeline snapshot</h2><p>A quick look at every stage</p></div><span className="panel-kicker">LIVE BREAKDOWN</span></div><div className="pipeline-list">
            {pipeline.map(({ status, label }) => {
              const count = stats?.countsByStatus[status] ?? 0;
              const percent = stats?.totalLeads ? Math.round((count / stats.totalLeads) * 100) : 0;
              return <div className="pipeline-row" key={status}><div className="pipeline-meta"><span className={`pipeline-dot status-${status.toLowerCase()}`} /><span>{label}</span><strong>{count}</strong></div><div className="pipeline-track"><span className={`pipeline-fill fill-${status.toLowerCase()}`} style={{ width: `${percent}%` }} /></div></div>;
            })}
          </div></section>
          <section className="panel focus-panel"><div className="focus-icon"><Sparkles size={24} /></div><div className="focus-copy"><span className="eyebrow">YOUR NEXT MOVE</span><h2>Keep your pipeline<br />in motion.</h2><p>{stats?.countsByStatus.New ? `You have ${stats.countsByStatus.New} new ${stats.countsByStatus.New === 1 ? "lead" : "leads"} ready for a first conversation.` : "Start by adding a lead or explore your existing opportunities."}</p></div><Link to={stats?.countsByStatus.New ? "/leads?status=New" : "/leads/new"} className="focus-link">{stats?.countsByStatus.New ? "Review new leads" : "Add your first lead"}<ArrowRight size={17} /></Link><div className="focus-orbit" aria-hidden="true" /></section>
        </div>

        <section className="panel recent-panel"><div className="panel-heading"><div><h2>Recent leads</h2><p>The latest opportunities in your workspace</p></div><Link className="text-link" to="/leads">View all leads <ArrowRight size={16} /></Link></div>{recentLeads.length ? <LeadTable leads={recentLeads} /> : <EmptyState title="No leads yet" description="Add a lead manually to get your pipeline started." action={{ label: "Add a lead", to: "/leads/new" }} />}</section>
      </>}
    </div>
  );
}
