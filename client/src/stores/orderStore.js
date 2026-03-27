import { create } from "zustand";
import { createOrder, getMyOrders, getOrders } from "../api/orders";

export const useOrderStore = create((set) => ({
  orders: [],
  loading: false,
  error: null,
  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getOrders();
      set({ orders: data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load orders",
      });
    }
  },
  fetchMyOrders: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getMyOrders();
      set({ orders: data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load your orders",
      });
    }
  },
  placeOrder: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data = await createOrder(payload);
      set((state) => ({ orders: [data, ...state.orders], loading: false }));
      return data;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to create order";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
}));
