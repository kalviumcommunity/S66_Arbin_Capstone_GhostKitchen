import { Link, NavLink } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-brand-100 text-brand-700" : "text-slate-700 hover:bg-slate-100"
  }`;

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-slate-900">
          Ghost Kitchen
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/menu" className={navLinkClass}>
            Menu
          </NavLink>
          <NavLink to="/cart" className={navLinkClass}>
            Cart
          </NavLink>
          <NavLink to="/my-orders" className={navLinkClass}>
            My Orders
          </NavLink>
          <NavLink to="/owner/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              className="ml-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Logout {user?.name ? `(${user.name})` : ""}
            </button>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={navLinkClass}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
