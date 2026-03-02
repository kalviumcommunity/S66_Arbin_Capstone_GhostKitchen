import { useEffect } from "react";
import FoodList from "../components/FoodList";
import { useFoodStore } from "../stores/foodStore";

export default function Menu() {
  const { foods, loading, error, fetchFoods } = useFoodStore();

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Menu</h1>
        <p className="text-slate-600">Live menu data from backend API.</p>
      </div>

      {loading ? <p className="text-slate-600">Loading menu...</p> : null}
      {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}

      {!loading && !error ? <FoodList foods={foods} /> : null}
    </section>
  );
}
