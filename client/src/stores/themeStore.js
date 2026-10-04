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
  cycleTheme: () => set((state) => {
    const nextTheme = themes[(themes.indexOf(state.theme) + 1) % themes.length];
    localStorage.setItem(STORAGE_KEY, nextTheme);
    return { theme: nextTheme };
  }),
}));
