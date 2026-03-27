import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  items: [],
  addItem: (food) => {
    const existing = get().items.find((item) => item._id === food._id);
    if (existing) {
      set({
        items: get().items.map((item) =>
          item._id === food._id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
      return;
    }

    set({ items: [...get().items, { ...food, quantity: 1 }] });
  },
  removeItem: (foodId) => {
    set({ items: get().items.filter((item) => item._id !== foodId) });
  },
  updateQuantity: (foodId, quantity) => {
    const nextQty = Number(quantity);
    if (!Number.isFinite(nextQty) || nextQty <= 0) {
      set({ items: get().items.filter((item) => item._id !== foodId) });
      return;
    }

    set({
      items: get().items.map((item) =>
        item._id === foodId ? { ...item, quantity: Math.floor(nextQty) } : item
      ),
    });
  },
  clearCart: () => set({ items: [] }),
}));
