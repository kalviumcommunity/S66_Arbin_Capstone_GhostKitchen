import { useEffect } from "react";
import FoodList from "../components/FoodList";
import { useFoodStore } from "../stores/foodStore";

export default function Menu() {
  const foods = useFoodStore((state) => state.foods);
  const allFoods = useFoodStore((state) => state.allFoods);
  const loading = useFoodStore((state) => state.loading);
  const error = useFoodStore((state) => state.error);
  const search = useFoodStore((state) => state.search);
  const category = useFoodStore((state) => state.category);
  const sort = useFoodStore((state) => state.sort);
  const fetchFoods = useFoodStore((state) => state.fetchFoods);
  const setSearch = useFoodStore((state) => state.setSearch);
  const setCategory = useFoodStore((state) => state.setCategory);
  const setSort = useFoodStore((state) => state.setSort);

  const categories = [
    "all",
    ...Array.from(new Set(allFoods.map((food) => food.category))).sort((a, b) => a.localeCompare(b)),
  ];

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Menu</h1>
        <p className="text-slate-600">Live menu data with filters and sorting.</p>
      </div>

      <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by food name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All Categories" : item}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
        >
          <option value="default">Sort: Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A-Z</option>
        </select>
      </div>

      {loading ? <p className="text-slate-600">Loading menu...</p> : null}
      {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}

      {!loading && !error ? <FoodList foods={foods} /> : null}
    </section>
  );
}
