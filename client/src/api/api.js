import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const rawAuth = localStorage.getItem("gk_auth");
  if (!rawAuth) return config;

  try {
    const auth = JSON.parse(rawAuth);
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
  } catch {
    localStorage.removeItem("gk_auth");
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("gk_auth");
    }
    return Promise.reject(error);
  }
);

export default api;
