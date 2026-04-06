import { create } from "zustand";
import {
  getInventoryHistory,
  getInventoryItems,
  getLowStockItems,
  updateInventoryStock,
} from "../api/inventory";

export const useInventoryStore = create((set, get) => ({
  items: [],
  lowStockItems: [],
  history: [],
  loading: false,
  error: null,

  fetchInventory: async () => {
    set({ loading: true, error: null });
    try {
      const [items, lowStockItems, history] = await Promise.all([
        getInventoryItems(),
        getLowStockItems(),
        getInventoryHistory(100),
      ]);
      set({ items, lowStockItems, history, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load inventory",
      });
    }
  },

  updateStock: async (foodId, payload) => {
    const updated = await updateInventoryStock(foodId, payload);
    const state = get();

    const items = state.items.map((item) => (item._id === foodId ? updated : item));
    const lowStockItems = items
      .filter((item) => Number(item.stockQuantity || 0) <= Number(item.lowStockThreshold || 0))
      .sort((a, b) => Number(a.stockQuantity || 0) - Number(b.stockQuantity || 0));

    set({ items, lowStockItems });
    await get().fetchHistory();
    return updated;
  },

  fetchHistory: async () => {
    try {
      const history = await getInventoryHistory(100);
      set({ history });
    } catch {
      set({ history: [] });
    }
  },
}));
