import { useCartStore } from "../stores/cartStore";
import { formatPrice } from "../utils/formatPrice";

export default function FoodCard({ food }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{food.name}</h3>
        {food.isBestSeller ? (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
            Best Seller
          </span>
        ) : null}
      </div>

      <p className="text-sm text-slate-500">
        {food.category} • {food.type}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-lg font-bold text-slate-900">{formatPrice(food.price)}</p>
        <button
          type="button"
          onClick={() => addItem(food)}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Add
        </button>
      </div>
    </article>
  );
}
