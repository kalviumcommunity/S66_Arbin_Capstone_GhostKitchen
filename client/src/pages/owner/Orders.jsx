import { useEffect, useState } from "react";
import { useOwnerOrderStore } from "../../stores/ownerOrderStore";
import { formatPrice } from "../../utils/formatPrice";
import LiveIndicator from "../../components/LiveIndicator";

const ORDER_STATUS_OPTIONS = ["pending", "preparing", "ready", "completed", "cancelled"];

export default function OwnerOrders() {
  const orders = useOwnerOrderStore((state) => state.orders);
  const loading = useOwnerOrderStore((state) => state.loading);
  const error = useOwnerOrderStore((state) => state.error);
  const fetchOrders = useOwnerOrderStore((state) => state.fetchOrders);
  const updateStatus = useOwnerOrderStore((state) => state.updateStatus);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, status) => {
    setActionError("");
    try {
      await updateStatus(orderId, status);
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Manage Orders</h1>
      <p className="mt-2 text-slate-600">Review incoming orders and update their status.</p>
      <div className="mt-2">
        <LiveIndicator />
      </div>

      {actionError ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{actionError}</p> : null}
      {loading ? <p className="mt-4 text-slate-600">Loading orders...</p> : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Foods</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">#{order._id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-slate-700">{order.customerName}</td>
                  <td className="px-4 py-3 text-slate-700">{order.foods?.map((food) => food.name).join(", ") || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{formatPrice(order.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold capitalize text-slate-700"
                    >
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
