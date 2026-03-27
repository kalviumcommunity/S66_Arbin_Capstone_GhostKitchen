import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useFoodStore } from "../stores/foodStore";
import { formatPrice } from "../utils/formatPrice";

export default function Home() {
  const allFoods = useFoodStore((state) => state.allFoods);
  const fetchFoods = useFoodStore((state) => state.fetchFoods);

  useEffect(() => {
    if (!allFoods.length) {
      fetchFoods();
    }
  }, [allFoods.length, fetchFoods]);

  const bestsellers = useMemo(() => allFoods.filter((food) => food.isBestSeller).slice(0, 4), [allFoods]);
  const categories = useMemo(() => Array.from(new Set(allFoods.map((food) => food.category))).slice(0, 6), [allFoods]);

  return (
    <section className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-brand-50 to-amber-50 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Welcome to Ghost Kitchen</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Fresh dishes from our cloud kitchen. Browse menu, add to cart, place order, and track status.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/menu"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Browse Menu
          </Link>
          <Link
            to="/owner/login"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Owner Dashboard
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Top Categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.length ? (
            categories.map((category) => (
              <Link
                key={category}
                to="/menu"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                {category}
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-600">No categories yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Best Sellers</h2>
        {bestsellers.length ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellers.map((food) => (
              <div key={food._id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{food.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {food.category} • {food.type}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">{formatPrice(food.price)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No best sellers available yet.</p>
        )}
      </div>
    </section>
  );
}
