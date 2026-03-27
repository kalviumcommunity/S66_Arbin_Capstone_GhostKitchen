import { useMemo } from "react";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import { useCartStore } from "../stores/cartStore";

export default function Cart() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Cart</h1>
        {items.length ? (
          <button
            type="button"
            onClick={clearCart}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Clear cart
          </button>
        ) : null}
      </div>

      {!items.length ? (
        <p className="text-slate-600">Your cart is empty.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <CartItem
                key={item._id}
                item={item}
                onRemove={() => removeItem(item._id)}
                onDecrease={() => updateQuantity(item._id, item.quantity - 1)}
                onIncrease={() => updateQuantity(item._id, item.quantity + 1)}
              />
            ))}
          </div>
          <CartSummary total={total} itemCount={itemCount} />
        </div>
      )}
    </section>
  );
}
