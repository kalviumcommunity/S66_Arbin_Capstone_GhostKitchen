import { create } from "zustand";
import { createOrder, getMyOrders, getOrders } from "../api/orders";

export const useOrderStore = create((set) => ({
  orders: [],
  loading: false,
  error: null,
  setOrdersFromRealtime: (orders) => set({ orders }),
  upsertOrderFromRealtime: (order) => {
    if (!order?._id) return;
    set((state) => {
      const existing = state.orders.find((item) => item._id === order._id);
      if (existing) {
        return {
          orders: state.orders.map((item) => (item._id === order._id ? order : item)),
        };
      }
      return { orders: [order, ...state.orders] };
    });
  },
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
