import { useState } from "react";
import { useNotificationStore } from "../stores/notificationStore";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) {
            markAllRead();
          }
        }}
        className="relative rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Alerts
        {unreadCount > 0 ? (
          <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Alerts</p>
            <button
              type="button"
              onClick={clearNotifications}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          </div>

          {!notifications.length ? (
            <p className="text-xs text-slate-500">No recent alerts.</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-auto">
              {notifications.slice(0, 10).map((notification) => (
                <div key={notification.id} className="rounded-md bg-slate-50 px-2 py-2">
                  <p className="text-xs text-slate-700">{notification.message}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
