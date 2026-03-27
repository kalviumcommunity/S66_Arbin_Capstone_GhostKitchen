import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useOrderStore } from "../stores/orderStore";
import { formatPrice } from "../utils/formatPrice";

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

    if (!items.length) {
      setLocalError("Cart is empty");
      return;
    }

    if (!form.customerName.trim()) {
      setLocalError("Customer name is required");
      return;
    }

    try {
      const foods = items.flatMap((item) => Array.from({ length: item.quantity }, () => item._id));

      await placeOrder({
        customerName: form.customerName.trim(),
        foods,
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      clearCart();
      navigate("/order-success");
    } catch (error) {
      setLocalError(error.message);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-1 text-sm text-slate-600">Review details and place your order.</p>

        <div className="mt-6 space-y-4">
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
        </div>

        {localError || orderError ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{localError || orderError}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !items.length}
          className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Placing order..." : "Place Order"}
        </button>
      </form>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>

        {!items.length ? (
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
          <span className="text-base font-bold text-slate-900">{formatPrice(total)}</span>
        </div>
      </aside>
    </section>
  );
}
