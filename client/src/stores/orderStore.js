import { create } from "zustand";
import { cancelOrder, createOrder, getMyOrders, getOrders } from "../api/orders";
import { useAuthStore } from "./authStore";

export const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  cancellingId: null,
  cancelOrder: async (orderId) => {
    if (get().cancellingId) return;
    set({ cancellingId: orderId, error: null });
    try {
      const updated = await cancelOrder(orderId);
      set((state) => ({
        orders: state.orders.map((order) => order._id === orderId ? updated : order),
        cancellingId: null,
      }));
    } catch (error) {
      set({ cancellingId: null, error: error?.response?.data?.message || "Failed to cancel order" });
    }
  },
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
    if (get().loading) throw new Error("An order request is already in progress.");
    set({ loading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?._id;
      const storageKey = `gk_checkout_v1:${userId}`;
      const fingerprint = JSON.stringify({ ...payload, foods: [...payload.foods].sort() });
      let pending;
      try { pending = JSON.parse(sessionStorage.getItem(storageKey)); } catch { /* Replace invalid stored state. */ }
      if (pending?.fingerprint !== fingerprint || !pending?.key) {
        pending = { fingerprint, key: crypto.randomUUID() };
        sessionStorage.setItem(storageKey, JSON.stringify(pending));
      }
      // Keep the same key after an uncertain network failure, including across page reloads.
      const data = await createOrder(payload, pending.key);
      sessionStorage.removeItem(storageKey);
      set((state) => ({ orders: [data, ...state.orders.filter((order) => order._id !== data._id)], loading: false }));
      return data;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to create order";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
}));
