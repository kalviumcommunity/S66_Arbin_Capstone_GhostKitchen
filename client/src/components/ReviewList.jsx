import ReviewCard from "./ReviewCard";

export default function ReviewList({ reviews = [], onHelpful }) {
  if (!reviews.length) {
    return <p className="text-sm text-slate-500">No reviews yet.</p>;
  }

  return (
    <div className="space-y-2">
      {reviews.map((review) => (
        <ReviewCard key={review._id} review={review} onHelpful={() => onHelpful?.(review)} />
      ))}
    </div>
  );
}
