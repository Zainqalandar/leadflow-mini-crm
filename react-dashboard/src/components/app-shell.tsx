import { ArrowUpRight, ChartNoAxesCombined, LayoutDashboard, LogOut, Plus, UsersRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAuthToken } from "../utils/auth";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/leads", label: "All leads", icon: UsersRound, end: false },
];

export function AppShell() {
  const navigate = useNavigate();

  function handleLogout() {
    clearAuthToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="LeadFlow home">
          <span className="brand-mark"><ChartNoAxesCombined size={23} strokeWidth={2.6} /></span>
          <span className="brand-copy"><strong>leadflow</strong><small>MINI CRM</small></span>
        </NavLink>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
              <Icon size={19} aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon"><ArrowUpRight size={18} /></span>
            <strong>Keep moving forward</strong>
            <p>Every lead is an opportunity. Stay on top of the next conversation.</p>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="mobile-mark">↗</span> leadflow</div>
          <div className="topbar-right">
            <span className="workspace-chip"><span className="live-dot" /> Workspace live</span>
            <NavLink to="/leads/new" className="topbar-add"><Plus size={17} /> <span>New lead</span></NavLink>
            <div className="avatar" aria-label="Admin account">A</div>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
              <Icon size={18} aria-hidden="true" /> {label}
            </NavLink>
          ))}
          <button type="button" onClick={handleLogout}><LogOut size={18} aria-hidden="true" /> Sign out</button>
        </nav>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
