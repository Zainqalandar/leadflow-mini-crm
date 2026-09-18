import { createContext, useCallback, useContext, useReducer } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";
export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
};

type Action =
  | { type: "ADD"; payload: Notification }
  | { type: "REMOVE"; id: string };

export type NotificationContextValue = {
  notifications: Notification[];
  notify: (type: NotificationType, message: string, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
};

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used inside NotificationProvider");
  return context;
}

export function useNotificationState(): NotificationContextValue {
  const [notifications, dispatch] = useReducer(
    (state: Notification[], action: Action): Notification[] => {
      if (action.type === "ADD") return [action.payload, ...state].slice(0, 4);
      return state.filter((item) => item.id !== action.id);
    },
    [],
  );
  const dismiss = useCallback((id: string) => dispatch({ type: "REMOVE", id }), []);
  const notify = useCallback((type: NotificationType, message: string, duration = type === "error" ? 6000 : 4000) => {
    const id = `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dispatch({ type: "ADD", payload: { id, type, message } });
    if (duration) window.setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return {
    notifications,
    notify,
    dismiss,
    success: (message) => notify("success", message),
    error: (message) => notify("error", message),
    warning: (message) => notify("warning", message),
    info: (message) => notify("info", message),
  };
}
