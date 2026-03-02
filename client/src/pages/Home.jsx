import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-brand-50 to-amber-50 p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Welcome to Ghost Kitchen</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Phase 1 frontend is now connected to backend structure. Next steps will add full customer and owner
        features.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/menu"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Browse Menu
        </Link>
        <Link
          to="/owner/dashboard"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Owner Dashboard
        </Link>
      </div>
    </section>
  );
}
