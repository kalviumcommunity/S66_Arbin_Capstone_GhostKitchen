import { create } from "zustand";
import { getDashboardStats } from "../api/analytics";

export const useAnalyticsStore = create((set) => ({
  stats: null,
  salesByStatus: [],
  latestOrders: [],
  loading: false,
  error: null,
  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getDashboardStats();
      set({
        stats: data.stats,
        salesByStatus: data.salesByStatus || [],
        latestOrders: data.latestOrders || [],
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load dashboard data",
      });
    }
  },
}));
