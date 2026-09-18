import { ArrowRight, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import type { Lead, LeadStatus } from "../types/api";
import { formatDate, getInitials } from "../utils/format";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><span className="badge-dot" />{status}</span>;
}

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 75 ? "high" : score >= 55 ? "medium" : "low";
  return <span className={`score-badge score-${tone}`} aria-label={`Lead score ${score} out of 100`}>
    <span className="score-bar"><span style={{ width: `${score}%` }} /></span>
    <strong>{score}</strong><small>/100</small>
  </span>;
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="table-scroll">
      <table className="leads-table">
        <thead><tr><th>LEAD</th><th>SERVICE</th><th>STATUS</th><th>SCORE</th><th>ADDED</th><th aria-label="Open lead" /></tr></thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead._id}>
              <td><div className="lead-identity"><span className="lead-avatar">{getInitials(lead.name)}</span><span><strong>{lead.name}</strong><small>{lead.email}</small></span></div></td>
              <td><span className="table-service">{lead.service}</span><small className="source-label">{lead.source === "wordpress" ? "WordPress" : "Manual entry"}</small></td>
              <td><StatusBadge status={lead.status} /></td>
              <td><ScoreBadge score={lead.leadScore} /></td>
              <td><span className="table-date">{formatDate(lead.createdAt)}</span></td>
              <td><Link className="table-open" to={`/leads/${lead._id}`} aria-label={`View ${lead.name}`}><ArrowRight size={18} /></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; to: string } }) {
  return <div className="empty-state">
    <span className="empty-icon"><Inbox size={28} strokeWidth={1.6} /></span>
    <h3>{title}</h3><p>{description}</p>
    {action ? <Link to={action.to} className="button button-primary">{action.label}</Link> : null}
  </div>;
}

export function LoadingState({ label = "Loading your workspace…" }: { label?: string }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="error-state" role="alert"><strong>Couldn’t load this data</strong><p>{message}</p><button className="button button-secondary" type="button" onClick={onRetry}>Try again</button></div>;
}
