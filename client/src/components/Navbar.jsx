import { Link, NavLink } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";
import { useAuthStore } from "../stores/authStore";
import UserMenu from "./UserMenu";

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-brand-100 text-brand-700" : "text-slate-700 hover:bg-slate-100"
  }`;

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const isOwner = user?.role === "owner";

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
            Cart {cartCount > 0 ? `(${cartCount})` : ""}
          </NavLink>
          {isAuthenticated ? (
            <NavLink to="/my-orders" className={navLinkClass}>
              My Orders
            </NavLink>
          ) : null}

          {isOwner ? (
            <>
              <NavLink to="/owner/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/owner/foods" className={navLinkClass}>
                Foods
              </NavLink>
              <NavLink to="/owner/orders" className={navLinkClass}>
                Orders
              </NavLink>
            </>
          ) : null}

          {isAuthenticated ? (
            <UserMenu />
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
