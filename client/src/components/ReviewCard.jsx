import StarRating from "./StarRating";

export default function ReviewCard({ review, onHelpful }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{review.userId?.username || "Anonymous"}</p>
          <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleString()}</p>
        </div>
        <StarRating rating={review.rating} readOnly />
      </div>

      {review.comment ? <p className="mt-2 text-sm text-slate-700">{review.comment}</p> : null}

      {review.ownerResponse?.message ? (
        <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">Owner response</p>
          <p className="mt-1">{review.ownerResponse.message}</p>
        </div>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={onHelpful}
          className={`rounded-md border px-2 py-1 text-xs font-semibold ${
            review.isHelpfulByMe
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
        >
          Helpful ({review.helpful || 0})
        </button>
      </div>
    </article>
  );
}
