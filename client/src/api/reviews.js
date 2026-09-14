import api from "./api";

export const getFoodReviews = async (foodId) => {
  const { data } = await api.get(`/reviews/food/${foodId}`);
  return data;
};

export const getFoodReviewStats = async (foodId) => {
  const { data } = await api.get(`/reviews/food/${foodId}/stats`);
  return data;
};

export const getMyReviews = async () => {
  const { data } = await api.get("/reviews/me");
  return data;
};

export const createReview = async (payload) => {
  const { data } = await api.post("/reviews", payload);
  return data;
};

export const updateReview = async (reviewId, payload) => {
  const { data } = await api.put(`/reviews/${reviewId}`, payload);
  return data;
};

export const deleteReview = async (reviewId) => {
  const { data } = await api.delete(`/reviews/${reviewId}`);
  return data;
};

export const toggleReviewHelpful = async (reviewId) => {
  const { data } = await api.patch(`/reviews/${reviewId}/helpful`);
  return data;
};

export const respondToReview = async (reviewId, message) => {
  const { data } = await api.patch(`/reviews/${reviewId}/respond`, { message });
  return data;
};
