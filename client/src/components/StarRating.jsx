export default function StarRating({ rating = 0, outOf = 5, size = "text-sm", onRate, readOnly = false }) {
  return (
    <div className="inline-flex items-center gap-1" aria-label={`Rating ${rating} out of ${outOf}`}>
      {Array.from({ length: outOf }).map((_, index) => {
        const value = index + 1;
        const active = value <= Math.round(rating);

        if (readOnly) {
          return (
            <span key={value} className={`${size} ${active ? "text-amber-500" : "text-slate-300"}`}>
              ★
            </span>
          );
        }

        return (
          <button
            key={value}
            type="button"
            onClick={() => onRate?.(value)}
            className={`${size} leading-none ${active ? "text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
