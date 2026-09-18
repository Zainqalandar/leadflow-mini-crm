import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Mail, MessageSquareText, Phone, UserRound, Wallet } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/lead-ui";
import { useNotification } from "../context/notification-context";
import type { ApiErrorResponse, LeadInput } from "../types/api";
import { getApiErrorMessage } from "../utils/api-error";
import { createLead, getLead, updateLead } from "../utils/leadflow-api";

const emptyForm: LeadInput = { name: "", email: "", phone: "", service: "", budgetRange: "", message: "" };

function validate(form: LeadInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.name.trim().length < 2) errors.name = "Enter at least 2 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.phone.replace(/\D/g, "").length < 7) errors.phone = "Enter at least 7 digits.";
  if (!form.service.trim()) errors.service = "Enter the requested service.";
  if (!form.budgetRange.trim()) errors.budgetRange = "Enter a budget range.";
  if (form.message.trim().length < 10) errors.message = "Enter at least 10 characters.";
  return errors;
}

export function LeadFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success } = useNotification();
  const [form, setForm] = useState<LeadInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getLead(id).then((lead) => { if (active) { setForm({ name: lead.name, email: lead.email, phone: lead.phone, service: lead.service, budgetRange: lead.budgetRange, message: lead.message }); setLoadError(""); } })
      .catch((caught) => { if (active) setLoadError(getApiErrorMessage(caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);

  function change(field: keyof LeadInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
    setSubmitError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const localErrors = validate(form);
    setErrors(localErrors);
    if (Object.keys(localErrors).length) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as LeadInput;
      const lead = id ? await updateLead(id, payload) : await createLead(payload);
      success(id ? "Lead details updated." : "New lead added to your pipeline.");
      navigate(`/leads/${lead._id}`);
    } catch (caught) {
      if (axios.isAxiosError<ApiErrorResponse>(caught) && caught.response?.data?.errors) setErrors(caught.response.data.errors);
      setSubmitError(getApiErrorMessage(caught));
    } finally { setSubmitting(false); }
  }

  const backTo = id ? `/leads/${id}` : "/leads";

  return <div className="page-stack form-page"><Link to={backTo} className="back-link"><ArrowLeft size={17} /> {id ? "Back to lead" : "Back to all leads"}</Link><div className="page-heading"><div><div className="eyebrow">{id ? "EDIT LEAD" : "NEW OPPORTUNITY"}</div><h1>{id ? "Edit lead details" : "Add a new lead"}<span className="heading-period">.</span></h1><p>{id ? "Keep this lead’s information up to date." : "Capture a new opportunity and keep the conversation moving."}</p></div></div>
    {loading ? <LoadingState label="Loading lead…" /> : loadError ? <ErrorState message={loadError} onRetry={() => { setLoading(true); setReload((value) => value + 1); }} /> : <form className="lead-form" onSubmit={handleSubmit} noValidate><section className="panel form-panel"><div className="form-section-heading"><div className="form-section-icon"><UserRound size={20} /></div><div><h2>Contact information</h2><p>Who are you speaking with?</p></div></div><div className="form-grid">
      <div className="field"><label htmlFor="name">Full name <span>*</span></label><div className="form-input-wrap"><UserRound size={18} /><input id="name" value={form.name} onChange={(event) => change("name", event.target.value)} maxLength={100} placeholder="e.g. Sarah Johnson" autoComplete="name" aria-invalid={Boolean(errors.name)} /></div>{errors.name ? <small className="field-error">{errors.name}</small> : null}</div>
      <div className="field"><label htmlFor="email">Email address <span>*</span></label><div className="form-input-wrap"><Mail size={18} /><input id="email" type="email" value={form.email} onChange={(event) => change("email", event.target.value)} maxLength={254} placeholder="sarah@company.com" autoComplete="email" aria-invalid={Boolean(errors.email)} /></div>{errors.email ? <small className="field-error">{errors.email}</small> : null}</div>
      <div className="field"><label htmlFor="phone">Phone number <span>*</span></label><div className="form-input-wrap"><Phone size={18} /><input id="phone" type="tel" value={form.phone} onChange={(event) => change("phone", event.target.value)} maxLength={30} placeholder="+1 555 000 0000" autoComplete="tel" aria-invalid={Boolean(errors.phone)} /></div>{errors.phone ? <small className="field-error">{errors.phone}</small> : null}</div>
    </div></section>
    <section className="panel form-panel"><div className="form-section-heading"><div className="form-section-icon"><BriefcaseBusiness size={20} /></div><div><h2>Project details</h2><p>Understand what they’re looking for.</p></div></div><div className="form-grid">
      <div className="field"><label htmlFor="service">Service requested <span>*</span></label><div className="form-input-wrap"><BriefcaseBusiness size={18} /><input id="service" list="service-options" value={form.service} onChange={(event) => change("service", event.target.value)} maxLength={120} placeholder="e.g. Web development" aria-invalid={Boolean(errors.service)} /></div><datalist id="service-options"><option value="Web development" /><option value="Web design" /><option value="Branding" /><option value="SEO" /><option value="Digital marketing" /><option value="Mobile app" /><option value="E-commerce" /></datalist>{errors.service ? <small className="field-error">{errors.service}</small> : null}</div>
      <div className="field"><label htmlFor="budgetRange">Budget range <span>*</span></label><div className="form-input-wrap"><Wallet size={18} /><input id="budgetRange" list="budget-options" value={form.budgetRange} onChange={(event) => change("budgetRange", event.target.value)} maxLength={100} placeholder="e.g. $5,000–$10,000" aria-invalid={Boolean(errors.budgetRange)} /></div><datalist id="budget-options"><option value="Under $2,500" /><option value="$2,500–$5,000" /><option value="$5,000–$10,000" /><option value="$10,000+" /><option value="Custom quote" /></datalist>{errors.budgetRange ? <small className="field-error">{errors.budgetRange}</small> : null}</div>
      <div className="field full-width"><label htmlFor="message">Project message <span>*</span></label><div className="textarea-wrap"><MessageSquareText size={18} /><textarea id="message" value={form.message} onChange={(event) => change("message", event.target.value)} maxLength={2000} rows={6} placeholder="Tell us about the project, goals, and timeline…" aria-invalid={Boolean(errors.message)} /></div><div className="field-meta">{errors.message ? <small className="field-error">{errors.message}</small> : <small>At least 10 characters. More detail helps qualify the lead.</small>}<small>{form.message.length}/2000</small></div></div>
    </div></section>{submitError ? <div className="form-alert" role="alert">{submitError}</div> : null}<div className="form-actions"><Link className="button button-secondary" to={backTo}>Cancel</Link><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Saving…" : id ? "Save changes" : "Create lead"}<ArrowRight size={17} /></button></div></form>}
  </div>;
}
