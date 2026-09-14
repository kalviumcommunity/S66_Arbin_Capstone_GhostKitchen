import StarRating from "./StarRating";

export default function RatingSummary({ stats }) {
  if (!stats) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <p className="text-2xl font-bold text-slate-900">{Number(stats.averageRating || 0).toFixed(1)}</p>
        <div>
          <StarRating rating={stats.averageRating || 0} readOnly />
          <p className="mt-1 text-xs text-slate-500">{stats.totalReviews || 0} reviews</p>
        </div>
      </div>
    </div>
  );
}
