import { useEffect, useState } from "react";
import { getFoodReviews, respondToReview } from "../../api/reviews";
import { getFoods } from "../../api/foods";
import ReviewList from "../../components/ReviewList";

export default function OwnerReviews() {
  const [foods, setFoods] = useState([]);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseDraft, setResponseDraft] = useState({});

  useEffect(() => {
    const loadFoods = async () => {
      try {
        const data = await getFoods();
        setFoods(data);
      } catch {
        setError("Failed to load foods");
      }
    };
    loadFoods();
  }, []);

  useEffect(() => {
    if (!selectedFoodId) {
      setReviews([]);
      return;
    }

    const loadReviews = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getFoodReviews(selectedFoodId);
        setReviews(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [selectedFoodId]);

  const handleRespond = async (reviewId) => {
    const message = (responseDraft[reviewId] || "").trim();
    if (!message) return;

    try {
      const updated = await respondToReview(reviewId, message);
      setReviews((prev) => prev.map((review) => (review._id === reviewId ? updated : review)));
      setResponseDraft((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit response");
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Customer Reviews</h1>
      <p className="mt-2 text-slate-600">Review feedback and respond to customer comments.</p>

      <div className="mt-4 max-w-md">
        <select
          value={selectedFoodId}
          onChange={(e) => setSelectedFoodId(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select food item</option>
          {foods.map((food) => (
            <option key={food._id} value={food._id}>
              {food.name}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-4 text-slate-600">Loading reviews...</p> : null}

      {!loading && selectedFoodId ? (
        <div className="mt-6 space-y-3">
          <ReviewList reviews={reviews} />

          {reviews.map((review) => (
            <div key={`response-${review._id}`} className="rounded-md border border-slate-200 bg-white p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Respond to {review.userId?.username || "customer"}
              </p>
              <textarea
                rows={2}
                value={responseDraft[review._id] || ""}
                onChange={(e) =>
                  setResponseDraft((prev) => ({
                    ...prev,
                    [review._id]: e.target.value,
                  }))
                }
                placeholder="Type your response"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => handleRespond(review._id)}
                className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Send Response
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
