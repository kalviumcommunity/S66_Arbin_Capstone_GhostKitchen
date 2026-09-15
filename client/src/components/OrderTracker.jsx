import OrderStatusBadge from "./OrderStatusBadge";

const statuses = ["pending", "preparing", "ready", "completed"];

export default function OrderTracker({ order }) {
  if (!order) return <p className="text-sm text-slate-600">Select an order to track.</p>;
  const currentIndex = statuses.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Live order tracking</p>
          <h2 className="text-xl font-bold text-slate-900">#{order._id.slice(-6).toUpperCase()}</h2>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {cancelled ? <p className="mt-6 rounded-md bg-rose-50 p-3 text-sm text-rose-700">This order was cancelled.</p> : (
        <div className="mt-8 grid grid-cols-4 gap-2">
          {statuses.map((status, index) => (
            <div key={status} className="text-center">
              <div className={`mx-auto h-4 w-4 rounded-full ${index <= currentIndex ? "bg-teal-600" : "bg-slate-200"}`} />
              <p className={`mt-2 text-xs capitalize ${index <= currentIndex ? "font-semibold text-teal-700" : "text-slate-500"}`}>{status}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-7 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <p>{order.foods?.map((food) => food.name).join(", ") || "Order items"}</p>
        <p className="mt-1 text-xs text-slate-500">Placed {new Date(order.createdAt).toLocaleString()}</p>
      </div>
    </section>
  );
}
