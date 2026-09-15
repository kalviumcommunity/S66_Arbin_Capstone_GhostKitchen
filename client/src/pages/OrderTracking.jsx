import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import OrderTracker from "../components/OrderTracker";
import LiveIndicator from "../components/LiveIndicator";
import { useOrderStore } from "../stores/orderStore";

export default function OrderTracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orders = useOrderStore((state) => state.orders);
  const loading = useOrderStore((state) => state.loading);
  const fetchMyOrders = useOrderStore((state) => state.fetchMyOrders);
  const selectedId = searchParams.get("order");
  const selectedOrder = orders.find((order) => order._id === selectedId) || orders[0];

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  useEffect(() => {
    if (!selectedId && orders[0]?._id) setSearchParams({ order: orders[0]._id }, { replace: true });
  }, [orders, selectedId, setSearchParams]);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Tracking</h1>
          <p className="mt-2 text-slate-600">Watch your order move through the kitchen in real time.</p>
        </div>
        <LiveIndicator />
      </div>

      {loading ? <p className="mt-6 text-slate-600">Loading orders...</p> : null}
      {!loading && !orders.length ? <p className="mt-6 text-slate-600">No orders to track yet.</p> : null}
      {orders.length ? (
        <>
          <select value={selectedOrder?._id || ""} onChange={(event) => setSearchParams({ order: event.target.value })} className="mt-6 w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            {orders.map((order) => <option key={order._id} value={order._id}>Order #{order._id.slice(-6).toUpperCase()}</option>)}
          </select>
          <div className="mt-4"><OrderTracker order={selectedOrder} /></div>
        </>
      ) : null}
    </section>
  );
}
