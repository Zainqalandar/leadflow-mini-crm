import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CircleCheck, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState, ScoreBadge, StatusBadge } from "../components/lead-ui";
import { useNotification } from "../context/notification-context";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "../types/api";
import { getApiErrorMessage } from "../utils/api-error";
import { formatDateTime, getInitials } from "../utils/format";
import { deleteLead, getLead, updateLeadStatus } from "../utils/leadflow-api";

export function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getLead(id)
      .then((result) => { if (active) { setLead(result); setError(""); } })
      .catch((caught) => { if (active) setError(getApiErrorMessage(caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);

  async function changeStatus(status: LeadStatus) {
    if (!id || !lead || status === lead.status) return;
    setSavingStatus(true);
    try {
      const updated = await updateLeadStatus(id, status);
      setLead(updated);
      success(`Lead moved to ${status}.`);
    } catch (caught) {
      notifyError(getApiErrorMessage(caught));
    } finally { setSavingStatus(false); }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteLead(id);
      success("Lead deleted successfully.");
      navigate("/leads", { replace: true });
    } catch (caught) {
      notifyError(getApiErrorMessage(caught));
      setDeleting(false);
    }
  }

  return <div className="page-stack detail-page">
    <Link to="/leads" className="back-link"><ArrowLeft size={17} /> Back to all leads</Link>
    {loading ? <LoadingState label="Loading lead details…" /> : error ? <ErrorState message={error} onRetry={() => { setLoading(true); setReload((value) => value + 1); }} /> : lead ? <>
      <div className="detail-heading"><div className="detail-title-group"><span className="detail-avatar">{getInitials(lead.name)}</span><div><div className="eyebrow">LEAD PROFILE</div><h1>{lead.name}</h1><p>Added {formatDateTime(lead.createdAt)} · {lead.source === "wordpress" ? "WordPress" : "Manual entry"}</p></div></div><div className="detail-heading-actions"><Link to={`/leads/${lead._id}/edit`} className="button button-secondary"><Pencil size={17} /> Edit details</Link><button type="button" className="button button-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={17} /> Delete</button></div></div>
      <div className="detail-grid"><div className="detail-main">
        <section className="panel detail-panel"><div className="panel-heading"><div><h2>Contact details</h2><p>Everything you need to reach out</p></div><CircleCheck size={20} className="panel-heading-icon" /></div><div className="details-list"><div><span>Email address</span><a href={`mailto:${lead.email}`}>{lead.email}<ExternalLink size={14} /></a></div><div><span>Phone number</span><a href={`tel:${lead.phone}`}>{lead.phone}<ExternalLink size={14} /></a></div><div><span>Service requested</span><strong>{lead.service}</strong></div><div><span>Budget range</span><strong>{lead.budgetRange}</strong></div><div><span>Lead source</span><strong>{lead.source === "wordpress" ? "WordPress form" : "Manual entry"}</strong></div></div></section>
        <section className="panel detail-panel"><div className="panel-heading"><div><h2>Project message</h2><p>What this lead shared with you</p></div></div><p className="lead-message">{lead.message}</p></section>
      </div><aside className="detail-aside">
        <section className="panel status-panel"><div className="panel-heading"><div><h2>Lead status</h2><p>Keep the pipeline current</p></div></div><StatusBadge status={lead.status} /><label htmlFor="lead-status">Move to stage</label><select id="lead-status" value={lead.status} disabled={savingStatus} onChange={(event) => changeStatus(event.target.value as LeadStatus)}>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select>{savingStatus ? <small>Saving status…</small> : null}</section>
        <section className="panel score-panel"><div className="panel-heading"><div><h2>Lead score</h2><p>Calculated by the API</p></div></div><div className="large-score"><strong>{lead.leadScore}</strong><span>/ 100</span></div><div className="large-score-track"><span style={{ width: `${lead.leadScore}%` }} /></div><p>Based on budget, service, and information provided.</p><ScoreBadge score={lead.leadScore} /></section>
        <section className="panel timeline-panel"><CalendarDays size={19} /><div><strong>Last updated</strong><span>{formatDateTime(lead.updatedAt)}</span></div></section>
      </aside></div>
      {confirmDelete ? <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmDelete(false); }}><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><span className="confirm-icon"><Trash2 size={23} /></span><h2 id="delete-title">Delete this lead?</h2><p id="delete-description">{lead.name} and their details will be permanently removed from the CRM.</p><div><button className="button button-secondary" type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button><button className="button button-danger" type="button" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete lead"}</button></div></div></div> : null}
    </> : null}
  </div>;
}
