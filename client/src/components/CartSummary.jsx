import { Link } from "react-router-dom";
import { formatPrice } from "../utils/formatPrice";

export default function CartSummary({ total, itemCount }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">Items</span>
        <span className="text-slate-900">{itemCount}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">Total</span>
        <span className="text-base font-bold text-slate-900">{formatPrice(total)}</span>
      </div>

      <Link
        to="/checkout"
        className="mt-4 block rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
