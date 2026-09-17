import { useThemeStore } from "../stores/themeStore";

const labels = {
  light: "Light mode",
  dark: "Dark mode",
  night: "Night mode",
};

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
      <span className="sr-only">Choose color theme</span>
      <span aria-hidden="true">{theme === "light" ? "☀" : theme === "dark" ? "◐" : "☾"}</span>
      <select
        aria-label="Choose color theme"
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        className="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold outline-none focus:ring-0"
      >
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  );
}
