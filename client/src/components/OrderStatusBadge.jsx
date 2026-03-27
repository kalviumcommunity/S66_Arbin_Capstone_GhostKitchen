const STATUS_CLASS = {
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-sky-100 text-sky-700",
  ready: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-200 text-slate-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
