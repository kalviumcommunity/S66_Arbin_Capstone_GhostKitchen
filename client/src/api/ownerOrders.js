import api from "./api";

export const getOwnerOrders = async () => {
  const { data } = await api.get("/orders");
  return data;
};

export const patchOwnerOrderStatus = async (orderId, status) => {
  const { data } = await api.patch(`/orders/${orderId}/status`, { status });
  return data;
};
