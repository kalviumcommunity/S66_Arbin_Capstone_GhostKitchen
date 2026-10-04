import { useThemeStore } from "../stores/themeStore";

const themeDetails = {
  light: { icon: "☀", label: "light" },
  dark: { icon: "◐", label: "dark" },
  night: { icon: "☾", label: "night" },
};

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const cycleTheme = useThemeStore((state) => state.cycleTheme);
  const { icon, label } = themeDetails[theme];

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycleTheme}
      aria-label={`${label} mode. Click to switch mode`}
      title={`${label} mode`}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="theme-toggle-label">{label}</span>
    </button>
  );
}
