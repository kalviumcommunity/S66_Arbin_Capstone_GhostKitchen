import { create } from "zustand";

const STORAGE_KEY = "gk_theme";
const themes = ["light", "dark", "night"];

const getInitialTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return themes.includes(saved) ? saved : "light";
};

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    if (!themes.includes(theme)) return;
    localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },
}));
