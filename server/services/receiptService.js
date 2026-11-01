import { OrderError } from "./orderPolicy.js";

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const money = (value) => `INR ${Number(value).toFixed(2)}`;

export function receiptHTML(order) {
  if (!["paid", "refund_pending", "refund_failed", "refunded"].includes(order.paymentStatus)) throw new OrderError(409, "A payment receipt is available after payment is collected or captured.");
  const rows = order.items?.length ? order.items.map((item) => `<tr><td>${escape(item.name)}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}</td><td>${money(item.lineTotal)}</td></tr>`).join("") : '<tr><td colspan="4">Legacy order: original item prices unavailable.</td></tr>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Receipt GK-${escape(order._id)}</title><style>
  body{font:16px system-ui,sans-serif;color:#17212b;max-width:800px;margin:40px auto;padding:24px}h1{margin-bottom:6px}small{color:#52606d}table{width:100%;border-collapse:collapse;margin:30px 0}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #ddd}th{background:#f5f5f5}td:not(:first-child),th:not(:first-child){text-align:right}.total{text-align:right;font-size:20px}footer{border-top:1px solid #ddd;margin-top:36px;padding-top:16px;font-size:13px}@media print{body{margin:0;max-width:none}}
  </style></head><body><h1>${escape(process.env.RECEIPT_BUSINESS_NAME || "Ghost Kitchen")}</h1><small>Payment receipt · GK-${escape(order._id)}</small>
  <p>${escape(process.env.RECEIPT_BUSINESS_ADDRESS || "")}</p><p><strong>Customer:</strong> ${escape(order.customerName)}<br>${escape(order.address)}<br>${escape(order.phone)}</p>
  <p><strong>Order date:</strong> ${escape(new Date(order.createdAt).toISOString())}<br><strong>Paid:</strong> ${escape(order.payment?.paidAt ? new Date(order.payment.paidAt).toISOString() : "Recorded payment")}</p>
  <table><thead><tr><th>Item</th><th>Quantity</th><th>Unit price</th><th>Line total</th></tr></thead><tbody>${rows}</tbody></table><p class="total"><strong>Total paid: ${money(order.totalPrice)}</strong></p>
  <p><strong>Method:</strong> ${order.paymentMethod === "razorpay" ? "Razorpay (test mode)" : "Cash on delivery"}<br><strong>Payment status:</strong> ${escape(order.paymentStatus)}<br><strong>Transaction:</strong> ${escape(order.payment?.paymentId || "Cash collected by kitchen")}</p>
  ${order.payment?.refundStatus ? `<p><strong>Refund:</strong> ${escape(order.payment.refundStatus)} · ${money((order.payment.refundAmountPaise || 0) / 100)}<br><strong>Refund reference:</strong> ${escape(order.payment.refundId || "Awaiting provider reference")}</p>` : ""}
  <footer>Keep this receipt for your records. Use your browser's Print menu to save it as PDF. This is a payment receipt, not a GST tax invoice.</footer></body></html>`;
}
