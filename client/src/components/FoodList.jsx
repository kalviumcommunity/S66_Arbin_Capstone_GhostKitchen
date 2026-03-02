import FoodCard from "./FoodCard";

export default function FoodList({ foods = [] }) {
  if (!foods.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
        No food items available.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {foods.map((food) => (
        <FoodCard key={food._id || food.id} food={food} />
      ))}
    </section>
  );
}
