import { create } from "zustand";
import { getFoods } from "../api/foods";
import { createFood, deleteFood, updateFood } from "../api/ownerFoods";

const applyFilters = (foods, { search, category, sort }) => {
  let next = foods.filter((food) => food.isAvailable !== false && Number(food.stockQuantity || 0) > 0);

  if (category && category !== "all") {
    next = next.filter((food) => food.category === category);
  }

  if (search.trim()) {
    const query = search.trim().toLowerCase();
    next = next.filter((food) => food.name.toLowerCase().includes(query));
  }

  if (sort === "price_asc") {
    next.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    next.sort((a, b) => b.price - a.price);
  } else if (sort === "name_asc") {
    next.sort((a, b) => a.name.localeCompare(b.name));
  }

  return next;
};

export const useFoodStore = create((set, get) => ({
  allFoods: [],
  foods: [],
  loading: false,
  error: null,
  search: "",
  category: "all",
  sort: "default",
  fetchFoods: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getFoods();
      const state = get();
      set({
        allFoods: data,
        foods: applyFilters(data, {
          search: state.search,
          category: state.category,
          sort: state.sort,
        }),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load foods",
      });
    }
  },
  setSearch: (search) => {
    const state = get();
    set({
      search,
      foods: applyFilters(state.allFoods, {
        search,
        category: state.category,
        sort: state.sort,
      }),
    });
  },
  setCategory: (category) => {
    const state = get();
    set({
      category,
      foods: applyFilters(state.allFoods, {
        search: state.search,
        category,
        sort: state.sort,
      }),
    });
  },
  setSort: (sort) => {
    const state = get();
    set({
      sort,
      foods: applyFilters(state.allFoods, {
        search: state.search,
        category: state.category,
        sort,
      }),
    });
  },
  createFoodItem: async (payload) => {
    const created = await createFood(payload);
    const state = get();
    const allFoods = [created, ...state.allFoods];
    set({
      allFoods,
      foods: applyFilters(allFoods, {
        search: state.search,
        category: state.category,
        sort: state.sort,
      }),
    });
    return created;
  },
  updateFoodItem: async (foodId, payload) => {
    const updated = await updateFood(foodId, payload);
    const state = get();
    const allFoods = state.allFoods.map((food) => (food._id === foodId ? updated : food));
    set({
      allFoods,
      foods: applyFilters(allFoods, {
        search: state.search,
        category: state.category,
        sort: state.sort,
      }),
    });
    return updated;
  },
  deleteFoodItem: async (foodId) => {
    await deleteFood(foodId);
    const state = get();
    const allFoods = state.allFoods.filter((food) => food._id !== foodId);
    set({
      allFoods,
      foods: applyFilters(allFoods, {
        search: state.search,
        category: state.category,
        sort: state.sort,
      }),
    });
  },
}));
