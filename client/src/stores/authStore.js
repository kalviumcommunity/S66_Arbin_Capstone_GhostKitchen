import { create } from "zustand";
import { getMe, login as loginApi, register as registerApi } from "../api/auth";

const initialAuth = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const getPersistedAuth = () => {
  const raw = localStorage.getItem("gk_auth");
  if (!raw) return initialAuth;

  try {
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user || null,
      token: parsed.token || null,
      isAuthenticated: Boolean(parsed.token),
      loading: false,
      error: null,
    };
  } catch {
    localStorage.removeItem("gk_auth");
    return initialAuth;
  }
};

const persistAuth = (authState) => {
  localStorage.setItem(
    "gk_auth",
    JSON.stringify({
      user: authState.user,
      token: authState.token,
    })
  );
};

export const useAuthStore = create((set, get) => ({
  ...getPersistedAuth(),

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data = await loginApi(payload);
      const next = {
        user: data.user,
        token: data.token,
        isAuthenticated: Boolean(data.token),
        loading: false,
        error: null,
      };
      persistAuth(next);
      set(next);
      return data;
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data = await registerApi(payload);
      const next = {
        user: data.user,
        token: data.token,
        isAuthenticated: Boolean(data.token),
        loading: false,
        error: null,
      };
      persistAuth(next);
      set(next);
      return data;
    } catch (error) {
      const message = error?.response?.data?.message || "Registration failed";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  checkAuth: async () => {
    const { token } = get();
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const data = await getMe();
      const next = {
        user: data.user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
      persistAuth(next);
      set(next);
    } catch {
      localStorage.removeItem("gk_auth");
      set({ ...initialAuth });
    }
  },

  logout: () => {
    localStorage.removeItem("gk_auth");
    set({ ...initialAuth });
  },

  isOwner: () => get().user?.role === "owner",
  isCustomer: () => get().user?.role === "customer",
}));
