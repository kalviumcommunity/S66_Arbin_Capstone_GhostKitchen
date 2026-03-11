import api from "./api";

export const login = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const register = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const getMe = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put("/auth/profile", payload);
  return data;
};
