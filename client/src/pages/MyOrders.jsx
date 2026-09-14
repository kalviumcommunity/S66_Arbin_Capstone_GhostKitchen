import { useEffect } from "react";
import { useCartStore } from "../stores/cartStore";
import OrderCard from "../components/OrderCard";
import { useOrderStore } from "../stores/orderStore";
import LiveIndicator from "../components/LiveIndicator";
import { useState } from "react";
import WriteReviewModal from "../components/WriteReviewModal";
import { useReviewStore } from "../stores/reviewStore";

export default function MyOrders() {
  const orders = useOrderStore((state) => state.orders);
  const loading = useOrderStore((state) => state.loading);
  const error = useOrderStore((state) => state.error);
  const fetchMyOrders = useOrderStore((state) => state.fetchMyOrders);
  const addItem = useCartStore((state) => state.addItem);
  const submitReview = useReviewStore((state) => state.submitReview);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewError, setReviewError] = useState("");

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

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setReviewModalOpen(true)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Write Review
        </button>
      </div>

      {loading ? <p className="mt-4 text-slate-600">Loading orders...</p> : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}
      {reviewError ? <p className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{reviewError}</p> : null}

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

      <WriteReviewModal
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setReviewError("");
        }}
        orderOptions={orders.filter((order) => order.status === "completed")}
        onSubmit={async (payload) => {
          setReviewError("");
          try {
            await submitReview(payload);
            setReviewModalOpen(false);
            fetchMyOrders();
          } catch (err) {
            setReviewError(err.message || "Failed to submit review");
          }
        }}
      />
    </section>
  );
}
