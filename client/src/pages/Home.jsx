import { Link } from "react-router-dom";

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-3.2 3.6-5.2 8-5.2s8 2 8 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <section className="home-entrance mx-auto max-w-4xl">
      <div className="home-panel rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-8 shadow-sm sm:p-10">
        <h1 className="home-title text-center text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Welcome to Ghost Kitchen</h1>
        <p className="home-subtitle mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-300">
          Select your role to continue.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/customer"
            className="home-role-card group rounded-xl border border-slate-200 bg-white p-6 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <ProfileIcon />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Customer</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Login or register to browse and place food orders.</p>
          </Link>

          <Link
            to="/owner/login"
            className="home-role-card group rounded-xl border border-slate-200 bg-white p-6 text-center transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-800"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <ProfileIcon />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Owner</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Use authorized owner credentials to access analytics dashboard.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
