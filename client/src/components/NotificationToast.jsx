import { useNotificationStore } from "../stores/notificationStore";

export default function NotificationToast() {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);

  if (!notifications.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {notifications.slice(0, 4).map((notification) => (
        <div
          key={notification.id}
          className="pointer-events-auto rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-800">{notification.message}</p>
            <button
              type="button"
              onClick={() => dismissNotification(notification.id)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
