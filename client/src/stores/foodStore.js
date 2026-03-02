import { create } from "zustand";
import { getFoods } from "../api/foods";

export const useFoodStore = create((set) => ({
  foods: [],
  loading: false,
  error: null,
  fetchFoods: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getFoods();
      set({ foods: data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load foods",
      });
    }
  },
}));
