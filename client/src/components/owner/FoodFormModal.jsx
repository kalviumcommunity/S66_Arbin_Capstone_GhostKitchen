import { useEffect, useState } from "react";

const initialForm = {
  name: "",
  category: "veg",
  type: "main",
  price: "",
  isBestSeller: false,
  stockQuantity: "0",
  lowStockThreshold: "5",
  unit: "portion",
  isAvailable: true,
};

export default function FoodFormModal({ open, onClose, onSubmit, food }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (food) {
        setForm({
          name: food.name || "",
          category: food.category || "veg",
          type: food.type || "main",
          price: String(food.price ?? ""),
          isBestSeller: Boolean(food.isBestSeller),
          stockQuantity: String(food.stockQuantity ?? 0),
          lowStockThreshold: String(food.lowStockThreshold ?? 5),
          unit: food.unit || "portion",
          isAvailable: food.isAvailable !== false,
        });
      return;
    }
    setForm(initialForm);
  }, [food, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">{food ? "Edit Food" : "Add Food"}</h2>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              name: form.name.trim(),
              category: form.category,
              type: form.type,
              price: Number(form.price),
              isBestSeller: form.isBestSeller,
              stockQuantity: Number(form.stockQuantity),
              lowStockThreshold: Number(form.lowStockThreshold),
              unit: form.unit.trim() || "portion",
              isAvailable: form.isAvailable,
            });
          }}
        >
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Food name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="veg">veg</option>
              <option value="non-veg">non-veg</option>
              <option value="dessert">dessert</option>
              <option value="combo">combo</option>
              <option value="sweet">sweet</option>
              <option value="main">main</option>
              <option value="bread">bread</option>
            </select>

            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="main">main</option>
              <option value="combo">combo</option>
              <option value="sweet">sweet</option>
            </select>
          </div>

          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="Price"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
              placeholder="Stock quantity"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />

            <input
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={(e) => setForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
              placeholder="Low stock threshold"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <input
            value={form.unit}
            onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
            placeholder="Unit (e.g. portion, plate)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isBestSeller}
              onChange={(e) => setForm((prev) => ({ ...prev, isBestSeller: e.target.checked }))}
            />
            Mark as best seller
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
            />
            Available in menu
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              {food ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
