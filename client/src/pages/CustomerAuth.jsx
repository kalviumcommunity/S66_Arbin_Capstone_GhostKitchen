import { Link } from "react-router-dom";

export default function CustomerAuth() {
  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Customer Access</h1>
        <p className="mt-2 text-slate-600">Login to continue or register a new customer account.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            to="/login"
            className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-300 hover:bg-brand-50"
          >
            <p className="text-lg font-semibold text-slate-900">Login</p>
            <p className="mt-1 text-sm text-slate-600">Existing customer account</p>
          </Link>

          <Link
            to="/register"
            className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-300 hover:bg-brand-50"
          >
            <p className="text-lg font-semibold text-slate-900">Register</p>
            <p className="mt-1 text-sm text-slate-600">Create a new customer account</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
