import { useEffect } from "react";
import { useCartStore } from "../stores/cartStore";
import OrderCard from "../components/OrderCard";
import { useOrderStore } from "../stores/orderStore";
import LiveIndicator from "../components/LiveIndicator";

export default function MyOrders() {
  const orders = useOrderStore((state) => state.orders);
  const loading = useOrderStore((state) => state.loading);
  const error = useOrderStore((state) => state.error);
  const fetchMyOrders = useOrderStore((state) => state.fetchMyOrders);
  const addItem = useCartStore((state) => state.addItem);

  const handleReorder = (order) => {
    if (!order?.foods?.length) return;
    order.foods.forEach((food) => addItem(food));
  };

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
      <p className="mt-2 text-slate-600">Track your latest orders and status.</p>
      <div className="mt-2">
        <LiveIndicator />
      </div>

      {loading ? <p className="mt-4 text-slate-600">Loading orders...</p> : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}

      {!loading && !error && !orders.length ? (
        <p className="mt-4 text-slate-600">No orders yet.</p>
      ) : null}

      {!loading && !error && orders.length ? (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} onReorder={handleReorder} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
