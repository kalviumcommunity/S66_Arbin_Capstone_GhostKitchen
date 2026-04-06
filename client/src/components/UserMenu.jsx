import { useAuthStore } from "../stores/authStore";

export default function UserMenu() {
  const { user, logout } = useAuthStore();
  const displayName = user?.username || user?.email || "User";
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {initial}
      </span>
      <button
        type="button"
        onClick={logout}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Logout
      </button>
    </div>
  );
}
