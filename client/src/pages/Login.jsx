import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const authError = useAuthStore((state) => state.error);

  const [form, setForm] = useState({ email: "", password: "" });
  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!form.email || !form.password) {
      setLocalError("Email and password are required");
      return;
    }

    try {
      const data = await login(form);
      if (data.user?.role === "owner") {
        navigate("/owner/dashboard");
        return;
      }
      navigate("/menu");
    } catch (error) {
      setLocalError(error.message);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Customer Login</h1>
      <p className="mt-2 text-sm text-slate-600">Login to place orders and track your profile.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
          />
        </div>

        {localError || authError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{localError || authError}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        New here?{" "}
        <Link to="/register" className="font-semibold text-brand-700 hover:underline">
          Create account
        </Link>
      </p>
    </section>
  );
}
