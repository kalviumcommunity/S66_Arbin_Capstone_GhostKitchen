import api from "./api";

export const getFoods = async () => {
  const { data } = await api.get("/foods");
  return data;
};

export const getFoodsByCategory = async (category) => {
  const { data } = await api.get(`/foods/category/${category}`);
  return data;
};

export const getBestSellers = async () => {
  const { data } = await api.get("/foods/bestsellers");
  return data;
};
