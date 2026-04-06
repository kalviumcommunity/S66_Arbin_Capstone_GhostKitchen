import { useNotificationStore } from "../stores/notificationStore";

export default function LiveIndicator() {
  const isLive = useNotificationStore((state) => state.isLive);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
        isLive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      }`}
    >
      {isLive ? "Live" : "Offline"}
    </span>
  );
}
