import { useEffect, useState } from "react";
import { useInventoryStore } from "../../stores/inventoryStore";

const HISTORY_PAGE_SIZE = 6;

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
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

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

  useEffect(() => {
    setHistoryPage(1);
    setExpandedHistoryId(null);
  }, [historyFilter, historySearch]);

  const normalizedSearch = historySearch.trim().toLowerCase();
  const filteredHistory = history.filter((entry) => {
    const matchesFilter = historyFilter === "all" || entry.changeType === historyFilter;
    const searchableText = [entry.foodId?.name, entry.note, entry.updatedBy?.username, entry.changeType].filter(Boolean).join(" ").toLowerCase();
    return matchesFilter && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });
  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
  const visibleHistory = filteredHistory.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE);

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

           <section className="inventory-history mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
             <div className="flex flex-col gap-4">
               <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                 <div>
                   <div className="flex items-center gap-2">
                     <h2 className="text-lg font-semibold text-slate-900">Recent Inventory History</h2>
                     <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{filteredHistory.length} events</span>
                   </div>
                   <p className="mt-1 text-xs text-slate-500">Search, filter, or tap an update to inspect the details.</p>
                 </div>
                 <label className="relative block w-full sm:w-64">
                   <span className="sr-only">Search inventory history</span>
                   <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" aria-hidden="true">⌕</span>
                   <input
                     type="search"
                     value={historySearch}
                     onChange={(event) => setHistorySearch(event.target.value)}
                     placeholder="Search items or notes"
                     className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                   />
                 </label>
               </div>
               <div className="flex flex-wrap items-center justify-between gap-2">
                 <div className="flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1" role="group" aria-label="Filter inventory history">
                   {["all", "manual_adjustment", "order_placed"].map((filter) => (
                     <button
                       key={filter}
                       type="button"
                       onClick={() => setHistoryFilter(filter)}
                       aria-pressed={historyFilter === filter}
                       className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                         historyFilter === filter
                           ? "bg-white text-slate-900 shadow-sm"
                           : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                       }`}
                     >
                       {filter === "all" ? "All" : filter === "manual_adjustment" ? "Updates" : "Orders"}
                     </button>
                   ))}
                 </div>
                 {historySearch ? (
                   <button type="button" onClick={() => setHistorySearch("")} className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                     Clear search
                   </button>
                 ) : null}
               </div>
             </div>
             {!history.length ? (
               <p className="mt-2 text-sm text-slate-600">No stock history yet.</p>
             ) : !visibleHistory.length ? (
               <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                 <p className="text-sm font-semibold text-slate-700">No matching activity</p>
                 <p className="mt-1 text-xs text-slate-500">Try a different filter or search term.</p>
               </div>
             ) : (
               <div className="mt-3 space-y-2">
                 {visibleHistory.map((entry) => {
                   const isExpanded = expandedHistoryId === entry._id;
                   const isIncrease = entry.quantityChange >= 0;

                   return (
                     <button
                       key={entry._id}
                       type="button"
                       onClick={() => setExpandedHistoryId(isExpanded ? null : entry._id)}
                       className="inventory-history-item w-full rounded-lg border border-transparent bg-slate-50 px-3 py-3 text-left text-xs text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:shadow-sm"
                       aria-expanded={isExpanded}
                     >
                       <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                         <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isIncrease ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                           {isIncrease ? "+" : "-"}
                         </span>
                         <span className="min-w-0 flex-1">
                           <span className="flex flex-wrap items-center gap-2">
                             <span className="truncate font-semibold text-slate-900">{entry.foodId?.name || "Unknown item"}</span>
                             <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm">{entry.changeType === "order_placed" ? "Order" : "Stock update"}</span>
                           </span>
                           <span className="mt-0.5 block text-slate-500">{entry.previousStock} {"->"} {entry.newStock}</span>
                         </span>
                         <span className={`shrink-0 pt-1 font-bold ${isIncrease ? "text-emerald-600" : "text-rose-600"}`}>
                           {entry.quantityChange >= 0 ? "+" : ""}{entry.quantityChange}
                         </span>
                         <span className={`shrink-0 pt-1 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
                       </div>
                       {isExpanded ? (
                         <span className="mt-3 block break-words border-t border-slate-200 pt-3 text-slate-500">
                           {entry.note || "Stock level updated"}
                           {entry.createdAt ? ` · ${new Date(entry.createdAt).toLocaleString()}` : ""}
                         </span>
                       ) : null}
                     </button>
                   );
                 })}
               </div>
             )}
             {filteredHistory.length > HISTORY_PAGE_SIZE ? (
               <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                 <p className="text-xs text-slate-500">Page {historyPage} of {totalHistoryPages}</p>
                 <div className="flex gap-2">
                   <button
                     type="button"
                     onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                     disabled={historyPage === 1}
                     className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                   >
                     Previous
                   </button>
                   <button
                     type="button"
                     onClick={() => setHistoryPage((page) => Math.min(totalHistoryPages, page + 1))}
                     disabled={historyPage === totalHistoryPages}
                     className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                   >
                     Next
                   </button>
                 </div>
               </div>
             ) : null}
           </section>
        </>
      ) : null}
    </section>
  );
}
