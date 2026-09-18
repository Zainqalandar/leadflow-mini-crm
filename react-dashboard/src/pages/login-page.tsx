import { useState, type FormEvent } from "react";
import { ArrowRight, ChartNoAxesCombined, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../context/notification-context";
import { getApiErrorMessage } from "../utils/api-error";
import { hasAuthToken, setAuthToken } from "../utils/auth";
import { login } from "../utils/leadflow-api";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useNotification();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (hasAuthToken()) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      setAuthToken(result.token);
      success("Welcome back. Your workspace is ready.");
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from && from !== "/login" ? from : "/", { replace: true });
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Sign in failed. Check your credentials and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-layout">
      <div className="login-story">
        <div className="login-brand"><span className="brand-mark"><ChartNoAxesCombined size={24} strokeWidth={2.6} /></span><strong>leadflow</strong></div>
        <div className="login-story-content">
          <span className="eyebrow light">YOUR SALES WORKSPACE</span>
          <h1>Good conversations<br /><em>start here.</em></h1>
          <p>One clear place to capture opportunities, understand your pipeline, and turn every inquiry into momentum.</p>
          <div className="story-rule" />
          <div className="story-footnote"><span>01 / 03</span><span>Capture&nbsp; · &nbsp;Connect&nbsp; · &nbsp;Close</span></div>
        </div>
        <div className="login-decoration" aria-hidden="true"><span /><span /><span /></div>
      </div>
      <div className="login-form-panel">
        <div className="login-form-wrap">
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to LeadFlow</h2>
          <p className="login-subtitle">Enter your admin credentials to continue to your CRM dashboard.</p>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="email">Email address</label>
            <div className="input-with-icon"><Mail size={18} aria-hidden="true" /><input id="email" type="email" autoComplete="username" placeholder="you@agency.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <label htmlFor="password">Password</label>
            <div className="input-with-icon"><LockKeyhole size={18} aria-hidden="true" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            {error ? <div className="form-alert" role="alert">{error}</div> : null}
            <button className="button button-primary login-submit" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}<ArrowRight size={18} aria-hidden="true" /></button>
          </form>
          <p className="login-note">LeadFlow Mini CRM · Admin access only</p>
        </div>
      </div>
    </div>
  );
}
