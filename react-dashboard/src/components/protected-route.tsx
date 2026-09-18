import { useSyncExternalStore } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAuthToken, subscribeToAuthChanges } from "../utils/auth";

export function ProtectedRoute() {
  const location = useLocation();
  const authenticated = useSyncExternalStore(subscribeToAuthChanges, hasAuthToken);

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
