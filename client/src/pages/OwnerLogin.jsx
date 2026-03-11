import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { login, logout, loading, error } = useAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    loading: state.loading,
    error: state.error,
  }));

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
      if (data.user?.role !== "owner") {
        logout();
        setLocalError("This account is not an owner account");
        return;
      }
      navigate("/owner/dashboard");
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Owner Login</h1>
      <p className="mt-2 text-sm text-slate-600">Only owner accounts can access the dashboard.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Owner email"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
        />

        {localError || error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{localError || error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Owner Login"}
        </button>
      </form>
    </section>
  );
}
