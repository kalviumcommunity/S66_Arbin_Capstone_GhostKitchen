export default function QuantitySelector({ value, onDecrease, onIncrease }) {
  return (
    <div className="inline-flex items-center rounded-md border border-slate-300">
      <button
        type="button"
        onClick={onDecrease}
        className="px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        -
      </button>
      <span className="min-w-8 px-2 text-center text-sm font-medium text-slate-800">{value}</span>
      <button
        type="button"
        onClick={onIncrease}
        className="px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        +
      </button>
    </div>
  );
}
