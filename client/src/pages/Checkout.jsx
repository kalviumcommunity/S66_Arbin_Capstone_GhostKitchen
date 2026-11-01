import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useOrderStore } from "../stores/orderStore";
import { formatPrice } from "../utils/formatPrice";
import { payments, payForOrder } from "../api/payments";

export default function Checkout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const placeOrder = useOrderStore((state) => state.placeOrder);
  const loading = useOrderStore((state) => state.loading);
  const orderError = useOrderStore((state) => state.error);

  const [form, setForm] = useState({
    customerName: user?.username || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [localError, setLocalError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [paying, setPaying] = useState(false);
  const upsertOrder = useOrderStore((state) => state.upsertOrderFromRealtime);
  useEffect(() => {
    let active = true;
    payments.config().then((config) => { if (active) setOnlineEnabled(config.onlineEnabled); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!items.length && !pendingOrder) {
      setLocalError("Cart is empty");
      return;
    }

    if (!form.customerName.trim()) {
      setLocalError("Customer name is required");
      return;
    }

    try {
      setPaying(true);
      const foods = items.flatMap((item) => Array.from({ length: item.quantity }, () => item._id));

      const order = pendingOrder || await placeOrder({
        customerName: form.customerName.trim(),
        foods,
        phone: form.phone.trim(),
        address: form.address.trim(),
        paymentMethod,
      });
      if (order.status === "cancelled") throw new Error("The previous checkout was cancelled. Review your cart and place a new order.");
      clearCart();
      if (order.paymentMethod === "razorpay") {
        setPendingOrder(order);
        const paid = await payForOrder(order, user);
        upsertOrder(paid);
        if (paid.status === "cancelled") throw new Error("This checkout expired or was cancelled. Your payment is being refunded; check My Orders.");
      }
      navigate("/order-success");
    } catch (error) {
      setLocalError(error.response?.data?.message || error.message);
    } finally { setPaying(false); }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-1 text-sm text-slate-600">Review details and place your order.</p>

        <fieldset disabled={paying || loading || Boolean(pendingOrder)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="customerName" className="mb-1 block text-sm font-medium text-slate-700">
              Customer Name
            </label>
            <input
              id="customerName"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
            />
          </div>

          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-slate-700">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
            />
          </div>
          <div><label htmlFor="paymentMethod" className="mb-1 block text-sm font-medium text-slate-700">Payment method</label>
            <select id="paymentMethod" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="cod">Cash on delivery</option><option value="razorpay" disabled={!onlineEnabled}>Pay online — Razorpay test mode{onlineEnabled ? "" : " (not configured)"}</option>
            </select><p className="mt-2 text-sm text-slate-600">Online checkout reserves stock for 15 minutes. Eligible pending-order cancellations receive a full refund.</p>
          </div>
        </fieldset>
        {pendingOrder ? <div className="mt-4 rounded-md border border-amber-300 p-3 text-sm"><p>Order #{pendingOrder._id.slice(-6).toUpperCase()} is reserved for {formatPrice(pendingOrder.totalPrice)}. Payment is still being confirmed.</p><Link to="/my-orders" className="font-semibold underline">View order, check payment, or cancel</Link></div> : null}

        {localError || orderError ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{localError || orderError}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading || paying || (!items.length && !pendingOrder)}
          className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading || paying ? "Processing..." : pendingOrder ? "Retry online payment" : paymentMethod === "razorpay" ? "Reserve order & pay online" : "Place cash-on-delivery order"}
        </button>
      </form>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>

        {pendingOrder ? <div className="mt-4 space-y-3">{pendingOrder.items.map((item) => <div className="flex justify-between gap-3" key={item.foodId}><span>{item.name} × {item.quantity}</span><strong>{formatPrice(item.lineTotal)}</strong></div>)}</div> : !items.length ? (
          <p className="mt-3 text-sm text-slate-600">No items in cart.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item._id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-sm font-semibold text-slate-700">Total</span>
          <span className="text-base font-bold text-slate-900">{formatPrice(pendingOrder?.totalPrice ?? total)}</span>
        </div>
      </aside>
    </section>
  );
}
