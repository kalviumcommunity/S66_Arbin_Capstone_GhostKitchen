import { create } from "zustand";
import {
  createReview,
  getFoodReviewStats,
  getFoodReviews,
  getMyReviews,
  toggleReviewHelpful,
} from "../api/reviews";

export const useReviewStore = create((set, get) => ({
  reviewsByFood: {},
  statsByFood: {},
  myReviews: [],
  loading: false,
  error: null,

  fetchFoodReviews: async (foodId) => {
    if (!foodId) return;
    set({ loading: true, error: null });
    try {
      const [reviews, stats] = await Promise.all([getFoodReviews(foodId), getFoodReviewStats(foodId)]);
      set((state) => ({
        loading: false,
        reviewsByFood: {
          ...state.reviewsByFood,
          [foodId]: reviews,
        },
        statsByFood: {
          ...state.statsByFood,
          [foodId]: stats,
        },
      }));
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load reviews",
      });
    }
  },

  fetchMyReviews: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getMyReviews();
      set({ myReviews: data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || "Failed to load your reviews",
      });
    }
  },

  submitReview: async (payload) => {
    set({ loading: true, error: null });
    try {
      const review = await createReview(payload);
      const foodId = String(review.foodId?._id || review.foodId);
      const state = get();
      const foodReviews = state.reviewsByFood[foodId] || [];
      const nextFoodReviews = [review, ...foodReviews];
      set({
        loading: false,
        reviewsByFood: {
          ...state.reviewsByFood,
          [foodId]: nextFoodReviews,
        },
        myReviews: [review, ...state.myReviews],
      });
      await get().fetchFoodReviews(foodId);
      return review;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to submit review";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  markHelpful: async (reviewId, foodId) => {
    const result = await toggleReviewHelpful(reviewId);
    const state = get();
    const reviews = (state.reviewsByFood[foodId] || []).map((review) =>
      review._id === reviewId
        ? { ...review, helpful: result.helpful, isHelpfulByMe: result.isHelpfulByMe }
        : review
    );
    set({
      reviewsByFood: {
        ...state.reviewsByFood,
        [foodId]: reviews,
      },
    });
  },
}));
