import { formatPrice } from "../utils/formatPrice";
import OrderStatusBadge from "./OrderStatusBadge";
import { Link } from "react-router-dom";
import { getOrderItems } from "../utils/orderItems";

export default function OrderCard({ order, onReorder, onCancel, cancelling, cancelDisabled, onPayment, onCheckPayment, onReceipt, paymentBusy }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-2">
        {getOrderItems(order).map((item) => (
          <div key={item.foodId} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">{item.name} × {item.quantity}{item.unitPrice !== null ? ` @ ${formatPrice(item.unitPrice)}` : ""}</span>
            <span className="font-medium text-slate-900">{item.lineTotal !== null ? formatPrice(item.lineTotal) : ""}</span>
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
        {order.allowedStatuses?.includes("cancelled") ? (
          <button type="button" disabled={cancelDisabled} onClick={() => onCancel(order._id)} className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60">
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        ) : null}
        {order.paymentMethod === "razorpay" && order.status === "pending" && order.paymentStatus === "pending" ? <button type="button" disabled={paymentBusy} onClick={() => onPayment(order)} className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">Pay online</button> : null}
        {order.paymentMethod === "razorpay" ? <button type="button" disabled={paymentBusy} onClick={() => onCheckPayment(order)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-60">Check payment / refund</button> : null}
        {order.receiptAvailable ? <button type="button" disabled={paymentBusy} onClick={() => onReceipt(order)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-60">Download receipt</button> : null}
      </div>
      <p className="mt-3 text-sm text-slate-600">{order.paymentMethod === "razorpay" ? "Online (test mode)" : "Cash on delivery"} · Payment: {(order.paymentStatus || "unpaid").replaceAll("_", " ")}</p>
      {order.payment?.refundStatus ? <p className="mt-1 text-sm text-slate-600">Refund: {order.payment.refundStatus}{order.payment.refundId ? ` · ${order.payment.refundId}` : ""}</p> : null}
      {order.status === "pending" && order.paymentStatus === "pending" && order.paymentExpiresAt ? <p className="mt-1 text-sm text-slate-600">Payment reservation expires {new Date(order.paymentExpiresAt).toLocaleString()}.</p> : null}
    </article>
  );
}
