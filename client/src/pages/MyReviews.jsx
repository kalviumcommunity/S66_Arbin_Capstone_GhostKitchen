import { useEffect } from "react";
import { useReviewStore } from "../stores/reviewStore";
import ReviewList from "../components/ReviewList";

export default function MyReviews() {
  const myReviews = useReviewStore((state) => state.myReviews);
  const loading = useReviewStore((state) => state.loading);
  const error = useReviewStore((state) => state.error);
  const fetchMyReviews = useReviewStore((state) => state.fetchMyReviews);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">My Reviews</h1>
      <p className="mt-2 text-slate-600">See all reviews you have submitted.</p>

      {loading ? <p className="mt-4 text-slate-600">Loading reviews...</p> : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}

      {!loading && !error ? <div className="mt-6"><ReviewList reviews={myReviews} /></div> : null}
    </section>
  );
}
