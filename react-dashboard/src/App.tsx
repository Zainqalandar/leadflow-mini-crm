import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { ProtectedRoute } from "./components/protected-route";
import { DashboardPage } from "./pages/dashboard-page";
import { LeadDetailPage } from "./pages/lead-detail-page";
import { LeadFormPage } from "./pages/lead-form-page";
import { LeadsPage } from "./pages/leads-page";
import { LoginPage } from "./pages/login-page";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="leads/new" element={<LeadFormPage />} />
            <Route path="leads/:id/edit" element={<LeadFormPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
