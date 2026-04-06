import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
  }`;

export default function OwnerLayout() {
  return (
    <section className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Owner Panel</h2>
        <nav className="flex flex-col gap-1">
          <NavLink to="/owner/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/owner/orders" className={linkClass}>
            Orders
          </NavLink>
          <NavLink to="/owner/foods" className={linkClass}>
            Foods
          </NavLink>
          <NavLink to="/owner/inventory" className={linkClass}>
            Inventory
          </NavLink>
        </nav>
      </aside>

      <div>
        <Outlet />
      </div>
    </section>
  );
}
