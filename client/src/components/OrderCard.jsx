import { formatPrice } from "../utils/formatPrice";
import OrderStatusBadge from "./OrderStatusBadge";
import { Link } from "react-router-dom";

export default function OrderCard({ order, onReorder }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-2">
        {order.foods?.map((food, index) => (
          <div key={`${order._id}-${food._id}-${index}`} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">{food.name}</span>
            <span className="font-medium text-slate-900">{formatPrice(food.price)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm">
        <span className="text-slate-500">{new Date(order.createdAt).toLocaleString()}</span>
        <span className="font-bold text-slate-900">Total: {formatPrice(order.totalPrice)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/order-tracking?order=${order._id}`} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Track Order</Link>
        <button type="button" onClick={() => onReorder(order)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Reorder</button>
      </div>
    </article>
  );
}
