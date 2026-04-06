import { useEffect, useState } from "react";
import { useInventoryStore } from "../../stores/inventoryStore";

export default function OwnerInventory() {
  const items = useInventoryStore((state) => state.items);
  const lowStockItems = useInventoryStore((state) => state.lowStockItems);
  const history = useInventoryStore((state) => state.history);
  const loading = useInventoryStore((state) => state.loading);
  const error = useInventoryStore((state) => state.error);
  const fetchInventory = useInventoryStore((state) => state.fetchInventory);
  const updateStock = useInventoryStore((state) => state.updateStock);

  const [draftById, setDraftById] = useState({});
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSetDraft = (foodId, value) => {
    setDraftById((prev) => ({ ...prev, [foodId]: value }));
  };

  const handleSave = async (foodId) => {
    setActionError("");
    const value = draftById[foodId];
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      setActionError("Stock must be a non-negative number");
      return;
    }

    try {
      await updateStock(foodId, { stockQuantity: Math.floor(parsed) });
    } catch (err) {
      setActionError(err?.response?.data?.message || err.message || "Failed to update stock");
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
      <p className="mt-2 text-slate-600">Track stock, low inventory items, and recent stock history.</p>

      {actionError ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{actionError}</p> : null}
      {loading ? <p className="mt-4 text-slate-600">Loading inventory...</p> : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <>
          <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-lg font-semibold text-amber-900">Low Stock Alerts</h2>
            {!lowStockItems.length ? (
              <p className="mt-2 text-sm text-amber-800">No low stock items right now.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <span key={item._id} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                    {item.name}: {item.stockQuantity} {item.unit}
                  </span>
                ))}
              </div>
            )}
          </section>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Current Stock</th>
                  <th className="px-4 py-3">Threshold</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3 text-right">Update Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-slate-700">{item.stockQuantity}</td>
                    <td className="px-4 py-3 text-slate-700">{item.lowStockThreshold}</td>
                    <td className="px-4 py-3 text-slate-700">{item.unit}</td>
                    <td className="px-4 py-3 text-slate-700">{item.isAvailable ? "Available" : "Out of stock"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <input
                          type="number"
                          min="0"
                          value={draftById[item._id] ?? item.stockQuantity}
                          onChange={(e) => handleSetDraft(item._id, e.target.value)}
                          className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleSave(item._id)}
                          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent Inventory History</h2>
            {!history.length ? (
              <p className="mt-2 text-sm text-slate-600">No stock history yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {history.slice(0, 12).map((entry) => (
                  <div key={entry._id} className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">{entry.foodId?.name || "Unknown item"}</span>
                    {" "}
                    {entry.quantityChange >= 0 ? "+" : ""}
                    {entry.quantityChange} | {entry.previousStock} {"->"} {entry.newStock} | {entry.changeType}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
