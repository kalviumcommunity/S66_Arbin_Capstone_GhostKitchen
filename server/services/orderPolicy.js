// Keep cancellation eligibility here so future stage/time rules have one entry point.
export const ORDER_TRANSITIONS = Object.freeze({
  pending: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
});

export const canCancelOrder = (order) => order.status === "pending";

export const allowedOrderStatuses = (order, role) => {
  if (role !== "owner") return canCancelOrder(order) ? ["cancelled"] : [];
  return (ORDER_TRANSITIONS[order.status] || []).filter(
    (status) => (status !== "cancelled" || canCancelOrder(order)) &&
      (status !== "preparing" || order.paymentMethod !== "razorpay" || order.paymentStatus === "paid")
  );
};

export class OrderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const orderActions = (order, role) => {
  const result = { ...order.toObject(), allowedStatuses: allowedOrderStatuses(order, role) };
  delete result.requestHash;
  for (const key of ["checkoutLock", "checkoutLockUntil", "refundLock", "refundLockUntil", "refundReceipt", "refundAttempt"]) {
    if (result.payment) delete result.payment[key];
  }
  result.receiptAvailable = ["paid", "refund_pending", "refund_failed", "refunded"].includes(order.paymentStatus);
  return result;
};
