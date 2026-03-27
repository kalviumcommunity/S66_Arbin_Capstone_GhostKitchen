import api from "./api";

export const getOrders = async () => {
  const { data } = await api.get("/orders");
  return data;
};

export const getMyOrders = async () => {
  const { data } = await api.get("/orders/me");
  return data;
};

export const getMyOrderById = async (orderId) => {
  const { data } = await api.get(`/orders/me/${orderId}`);
  return data;
};

export const createOrder = async (payload) => {
  const { data } = await api.post("/orders", payload);
  return data;
};

export const updateOrderStatus = async (orderId, status) => {
  const { data } = await api.patch(`/orders/${orderId}/status`, { status });
  return data;
};
