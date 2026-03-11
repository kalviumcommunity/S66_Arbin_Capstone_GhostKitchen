import { useAuthStore } from "../stores/authStore";

export default function UserMenu() {
  const { user, logout } = useAuthStore();

  return (
    <div className="ml-2 flex items-center gap-2">
      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
        {user?.role || "user"}
      </span>
      <span className="hidden text-sm text-slate-600 md:inline">{user?.username || user?.email}</span>
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
