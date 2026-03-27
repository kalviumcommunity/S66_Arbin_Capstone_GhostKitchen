import { Link } from "react-router-dom";

export default function OrderSuccess() {
  return (
    <section className="mx-auto max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-emerald-800">Order placed successfully</h1>
      <p className="mt-2 text-emerald-700">Your kitchen has started preparing your order.</p>

      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/my-orders"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Track Orders
        </Link>
        <Link
          to="/menu"
          className="rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          Back to Menu
        </Link>
      </div>
    </section>
  );
}
