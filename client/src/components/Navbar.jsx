import { Link, NavLink } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";
import { useAuthStore } from "../stores/authStore";
import UserMenu from "./UserMenu";
import LiveIndicator from "./LiveIndicator";
import NotificationBell from "./NotificationBell";

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-brand-100 text-brand-700" : "text-slate-700 hover:bg-slate-100"
  }`;

export default function Navbar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const isOwner = user?.role === "owner";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="text-lg font-bold text-slate-900">
          Ghost Kitchen
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {!isAuthenticated ? (
            <>
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/customer" className={navLinkClass}>
                Customer
              </NavLink>
            </>
          ) : null}

          {isAuthenticated && !isOwner ? (
            <>
              <NavLink to="/menu" className={navLinkClass}>
                Menu
              </NavLink>
              <NavLink to="/cart" className={navLinkClass}>
                Cart {cartCount > 0 ? `(${cartCount})` : ""}
              </NavLink>
              <NavLink to="/my-orders" className={navLinkClass}>
                My Orders
              </NavLink>
            </>
          ) : null}

          {isAuthenticated && isOwner ? (
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

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={navLinkClass}>
                Register
              </NavLink>
            </>
          ) : null}

          {isAuthenticated ? <UserMenu /> : null}
          {isAuthenticated ? <LiveIndicator /> : null}
          {isAuthenticated ? <NotificationBell /> : null}
        </nav>
      </div>
    </header>
  );
}
