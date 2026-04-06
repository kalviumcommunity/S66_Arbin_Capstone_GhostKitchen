import api from "./api";

export const createFood = async (payload) => {
  const { data } = await api.post("/foods", payload);
  return data;
};

export const updateFood = async (foodId, payload) => {
  const { data } = await api.put(`/foods/${foodId}`, payload);
  return data;
};

export const deleteFood = async (foodId) => {
  const { data } = await api.delete(`/foods/${foodId}`);
  return data;
};
