import type { ReactNode } from "react";
import { NotificationContext, useNotificationState } from "./notification-context";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const value = useNotificationState();
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
