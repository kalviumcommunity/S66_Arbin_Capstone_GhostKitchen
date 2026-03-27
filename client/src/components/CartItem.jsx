import { formatPrice } from "../utils/formatPrice";
import QuantitySelector from "./QuantitySelector";

export default function CartItem({ item, onRemove, onDecrease, onIncrease }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">
          {item.category} • {item.type}
        </p>
        <div className="mt-2">
          <QuantitySelector value={item.quantity} onDecrease={onDecrease} onIncrease={onIncrease} />
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-900">{formatPrice(item.price * item.quantity)}</p>
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
