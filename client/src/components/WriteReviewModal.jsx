import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const initialState = {
  orderId: "",
  foodId: "",
  rating: 0,
  comment: "",
};

export default function WriteReviewModal({ open, onClose, orderOptions = [], onSubmit }) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (!open) return;
    setForm(initialState);
  }, [open]);

  if (!open) return null;

  const selectedOrder = orderOptions.find((order) => order._id === form.orderId);
  const foodOptions = selectedOrder?.foods || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
       <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-5">
        <h2 className="text-lg font-semibold text-slate-900">Write a Review</h2>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              orderId: form.orderId,
              foodId: form.foodId,
              rating: form.rating,
              comment: form.comment,
            });
          }}
        >
          <select
            value={form.orderId}
            onChange={(e) => setForm((prev) => ({ ...prev, orderId: e.target.value, foodId: "" }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Select completed order</option>
            {orderOptions.map((order) => (
              <option key={order._id} value={order._id}>
                #{order._id.slice(-6).toUpperCase()} - {new Date(order.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>

          <select
            value={form.foodId}
            onChange={(e) => setForm((prev) => ({ ...prev, foodId: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
            disabled={!form.orderId}
          >
            <option value="">Select food item</option>
            {foodOptions.map((food, index) => (
              <option key={`${food._id}-${index}`} value={food._id}>
                {food.name}
              </option>
            ))}
          </select>

          <div className="rounded-md border border-slate-200 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Rating</p>
            <StarRating
              rating={form.rating}
              onRate={(value) => setForm((prev) => ({ ...prev, rating: value }))}
              readOnly={false}
            />
          </div>

          <textarea
            rows={4}
            value={form.comment}
            onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
            placeholder="Share your experience"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              disabled={!form.orderId || !form.foodId || !form.rating}
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
