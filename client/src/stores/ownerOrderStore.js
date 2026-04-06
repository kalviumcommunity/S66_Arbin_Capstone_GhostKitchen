import { create } from "zustand";
import { getOwnerOrders, patchOwnerOrderStatus } from "../api/ownerOrders";

export const useOwnerOrderStore = create((set) => ({
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
      const data = await getOwnerOrders();
      set({ orders: data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load owner orders",
      });
    }
  },
  updateStatus: async (orderId, status) => {
    try {
      const updated = await patchOwnerOrderStatus(orderId, status);
      set((state) => ({
        orders: state.orders.map((order) => (order._id === orderId ? updated : order)),
      }));
      return updated;
    } catch (error) {
      throw new Error(error?.response?.data?.message || "Failed to update status");
    }
  },
}));
