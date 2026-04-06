import { useEffect, useState } from "react";
import FoodFormModal from "../../components/owner/FoodFormModal";
import { useFoodStore } from "../../stores/foodStore";
import { formatPrice } from "../../utils/formatPrice";

export default function OwnerFoods() {
  const foods = useFoodStore((state) => state.allFoods);
  const loading = useFoodStore((state) => state.loading);
  const error = useFoodStore((state) => state.error);
  const fetchFoods = useFoodStore((state) => state.fetchFoods);
  const createFoodItem = useFoodStore((state) => state.createFoodItem);
  const updateFoodItem = useFoodStore((state) => state.updateFoodItem);
  const deleteFoodItem = useFoodStore((state) => state.deleteFoodItem);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const openCreate = () => {
    setEditingFood(null);
    setModalOpen(true);
  };

  const openEdit = (food) => {
    setEditingFood(food);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    setActionError("");
    try {
      if (editingFood) {
        await updateFoodItem(editingFood._id, payload);
      } else {
        await createFoodItem(payload);
      }
      setModalOpen(false);
      setEditingFood(null);
    } catch (err) {
      setActionError(err?.response?.data?.message || "Failed to save food");
    }
  };

  const handleDelete = async (foodId) => {
    setActionError("");
    try {
      await deleteFoodItem(foodId);
    } catch (err) {
      setActionError(err?.response?.data?.message || "Failed to delete food");
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Foods</h1>
          <p className="mt-1 text-slate-600">Create, edit, and remove menu items.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Add Food
        </button>
      </div>

      {actionError ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{actionError}</p> : null}
      {loading ? <p className="text-slate-600">Loading foods...</p> : null}
      {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Best Seller</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {foods.map((food) => (
                <tr key={food._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{food.name}</td>
                  <td className="px-4 py-3 text-slate-700">{food.category}</td>
                  <td className="px-4 py-3 text-slate-700">{food.type}</td>
                  <td className="px-4 py-3 text-slate-700">{formatPrice(food.price)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {food.stockQuantity} {food.unit || "portion"}
                    {Number(food.stockQuantity || 0) <= Number(food.lowStockThreshold || 0) ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        low
                      </span>
                    ) : null}
                    {food.isAvailable === false ? (
                      <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800">
                        hidden
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{food.isBestSeller ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(food)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(food._id)}
                        className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <FoodFormModal
        open={modalOpen}
        food={editingFood}
        onClose={() => {
          setModalOpen(false);
          setEditingFood(null);
        }}
        onSubmit={handleSave}
      />
    </section>
  );
}
