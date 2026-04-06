import api from "./api";

export const getDashboardStats = async () => {
  const { data } = await api.get("/analytics/dashboard");
  return data;
};
