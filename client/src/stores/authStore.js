import { create } from "zustand";

const initialAuth = {
  user: null,
  token: null,
  isAuthenticated: false,
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
    };
  } catch {
    localStorage.removeItem("gk_auth");
    return initialAuth;
  }
};

export const useAuthStore = create((set) => ({
  ...getPersistedAuth(),
  setAuth: ({ user, token }) => {
    const next = { user: user || null, token: token || null, isAuthenticated: Boolean(token) };
    localStorage.setItem("gk_auth", JSON.stringify(next));
    set(next);
  },
  logout: () => {
    localStorage.removeItem("gk_auth");
    set(initialAuth);
  },
}));
