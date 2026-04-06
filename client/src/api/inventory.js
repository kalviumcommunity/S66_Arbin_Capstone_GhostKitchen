import api from "./api";

export const getInventoryItems = async () => {
  const { data } = await api.get("/inventory");
  return data;
};

export const getLowStockItems = async () => {
  const { data } = await api.get("/inventory/low-stock");
  return data;
};

export const getInventoryHistory = async (limit = 100) => {
  const { data } = await api.get(`/inventory/history?limit=${limit}`);
  return data;
};

export const updateInventoryStock = async (foodId, payload) => {
  const { data } = await api.patch(`/inventory/${foodId}/stock`, payload);
  return data;
};
