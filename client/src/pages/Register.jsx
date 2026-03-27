import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const authError = useAuthStore((state) => state.error);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!form.username || !form.email || !form.password) {
      setLocalError("Username, email and password are required");
      return;
    }

    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    try {
      await register(form);
      navigate("/menu");
    } catch (error) {
      setLocalError(error.message);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Customer Register</h1>
      <p className="mt-2 text-sm text-slate-600">Create account to place and manage orders.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
        />
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 pr-12 text-sm outline-none ring-brand-500 focus:ring"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <input
          name="phone"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
        />
        <textarea
          name="address"
          placeholder="Address (optional)"
          value={form.address}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
          rows={3}
        />

        {localError || authError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{localError || authError}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Login
        </Link>
      </p>
    </section>
  );
}
