import { CheckCircle2, CircleAlert, Info, X, XCircle } from "lucide-react";
import { useNotification, type NotificationType } from "../context/notification-context";

const icons: Record<NotificationType, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: CircleAlert,
  info: Info,
};

export function NotificationContainer() {
  const { notifications, dismiss } = useNotification();

  return (
    <div className="notification-container" aria-live="polite">
      {notifications.map((notification) => {
        const Icon = icons[notification.type];
        return (
          <div className={`notification notification-${notification.type}`} key={notification.id} role="alert">
            <Icon size={18} aria-hidden="true" />
            <span>{notification.message}</span>
            <button type="button" onClick={() => dismiss(notification.id)} aria-label="Dismiss notification">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
