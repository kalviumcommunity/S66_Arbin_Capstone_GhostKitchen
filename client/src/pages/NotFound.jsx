import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="mt-4 inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Go Home
      </Link>
    </section>
  );
}
