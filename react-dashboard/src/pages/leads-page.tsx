import { useEffect, useState } from "react";
import { Download, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LeadTable, LoadingState } from "../components/lead-ui";
import { useNotification } from "../context/notification-context";
import { LEAD_STATUSES, type Lead, type LeadStatus, type Pagination } from "../types/api";
import { getApiErrorMessage } from "../utils/api-error";
import { getLeads } from "../utils/leadflow-api";

const PAGE_SIZE = 10;

function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(leads: Lead[]): void {
  const columns = ["Name", "Email", "Phone", "Service", "Budget Range", "Message", "Status", "Source", "Lead Score", "Created At"];
  const rows = leads.map((lead) => [lead.name, lead.email, lead.phone, lead.service, lead.budgetRange, lead.message, lead.status, lead.source, lead.leadScore, lead.createdAt]);
  const csv = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `leadflow-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [status, setStatus] = useState<LeadStatus | "">(LEAD_STATUSES.includes(initialStatus as LeadStatus) ? initialStatus as LeadStatus : "");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [exporting, setExporting] = useState(false);
  const { success, error: notifyError } = useNotification();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let active = true;
    getLeads({ q: debouncedQuery || undefined, status: status || undefined, page, limit: PAGE_SIZE })
      .then((result) => { if (active) { setLeads(result.leads); setPagination(result.pagination); setError(""); } })
      .catch((caught) => { if (active) setError(getApiErrorMessage(caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedQuery, status, page, reload]);

  function changeStatus(value: LeadStatus | "") {
    setStatus(value);
    setPage(1);
    setLoading(true);
    setSearchParams(value ? { status: value } : {});
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const filters = { q: debouncedQuery || undefined, status: status || undefined };
      const first = await getLeads({ ...filters, page: 1, limit: 100 });
      const all = [...first.leads];
      for (let currentPage = 2; currentPage <= first.pagination.totalPages; currentPage += 1) {
        const next = await getLeads({ ...filters, page: currentPage, limit: 100 });
        all.push(...next.leads);
      }
      if (!all.length) { notifyError("There are no leads to export with these filters."); return; }
      downloadCsv(all);
      success(`Exported ${all.length} ${all.length === 1 ? "lead" : "leads"} to CSV.`);
    } catch (caught) {
      notifyError(getApiErrorMessage(caught, "Export failed. Please try again."));
    } finally {
      setExporting(false);
    }
  }

  return <div className="page-stack">
    <div className="page-heading"><div><div className="eyebrow">LEAD MANAGEMENT</div><h1>All leads<span className="heading-period">.</span></h1><p>Keep every conversation organized in one place.</p></div><Link to="/leads/new" className="button button-primary"><Plus size={18} /> Add new lead</Link></div>
    <section className="panel leads-panel">
      <div className="leads-panel-heading"><div><h2>Your leads</h2><p>{pagination ? `${pagination.total} ${pagination.total === 1 ? "opportunity" : "opportunities"} in this view` : "Search and manage your pipeline"}</p></div><button className="button button-secondary export-button" type="button" onClick={exportCsv} disabled={exporting || loading || !pagination?.total}><Download size={17} />{exporting ? "Exporting…" : "Export CSV"}</button></div>
      <div className="filters-bar">
        <div className="search-box"><Search size={19} aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setLoading(true); }} placeholder="Search name, email, service…" aria-label="Search leads" />{query ? <button type="button" onClick={() => { setQuery(""); setPage(1); setLoading(true); }} aria-label="Clear search"><X size={16} /></button> : null}</div>
        <div className="filter-select"><SlidersHorizontal size={18} aria-hidden="true" /><select aria-label="Filter by status" value={status} onChange={(event) => changeStatus(event.target.value as LeadStatus | "")}><option value="">All statuses</option>{LEAD_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      </div>
      {loading ? <LoadingState label="Loading leads…" /> : error ? <ErrorState message={error} onRetry={() => { setLoading(true); setReload((value) => value + 1); }} /> : leads.length ? <><LeadTable leads={leads} /><div className="pagination"><span>{pagination ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + leads.length} of ${pagination.total}` : ""}</span><div><button type="button" className="button button-secondary" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); setLoading(true); }}>Previous</button><span className="page-indicator">Page {page} of {pagination?.totalPages || 1}</span><button type="button" className="button button-secondary" disabled={!pagination || page >= pagination.totalPages} onClick={() => { setPage((value) => value + 1); setLoading(true); }}>Next</button></div></div></> : <EmptyState title={query || status ? "No matching leads" : "Your pipeline starts here"} description={query || status ? "Try a different search or status filter." : "Add your first lead manually to get started."} action={query || status ? undefined : { label: "Add a lead", to: "/leads/new" }} />}
    </section>
  </div>;
}
