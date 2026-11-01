import api from "./api";

export const payments = {
  config: async () => (await api.get("/payments/config")).data,
  start: async (id) => (await api.post(`/payments/${id}/start`, undefined, { timeout: 30000 })).data,
  verify: async (id, body) => (await api.post(`/payments/${id}/verify`, body, { timeout: 45000 })).data,
  reconcile: async (id) => (await api.post(`/payments/${id}/reconcile`, undefined, { timeout: 45000 })).data,
  refund: async (id) => (await api.post(`/payments/${id}/refund`, undefined, { timeout: 45000 })).data,
  collectCash: async (id) => (await api.post(`/payments/${id}/collect-cash`)).data,
  maintenance: async () => (await api.post("/payments/maintenance", undefined, { timeout: 60000 })).data,
};

let checkoutScript;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScript) checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const fail = () => { script.remove(); checkoutScript = undefined; reject(new Error("Unable to load Razorpay checkout. Please retry from My Orders.")); };
    const timer = setTimeout(fail, 20000);
    script.onload = () => { clearTimeout(timer); if (window.Razorpay) resolve(); else fail(); };
    script.onerror = () => { clearTimeout(timer); fail(); };
    document.head.appendChild(script);
  });
  return checkoutScript;
}

export async function payForOrder(order, user) {
  await loadCheckout();
  const checkout = await payments.start(order._id);
  if (checkout.alreadyPaid) return checkout.order;
  const result = await new Promise((resolve, reject) => {
    let submitted = false;
    const modal = new window.Razorpay({
      key: checkout.keyId, order_id: checkout.gatewayOrderId, amount: checkout.amount, currency: checkout.currency,
      name: "Ghost Kitchen", description: `Order ${order._id.slice(-6).toUpperCase()}`,
      image: `${window.location.origin}/ghost-kitchen-logo.jpeg`,
      prefill: { name: order.customerName || user?.username, email: user?.email, contact: order.phone || user?.phone },
      timeout: Math.max(1, Math.floor((new Date(checkout.expiresAt).getTime() - Date.now()) / 1000)),
      handler: (response) => { submitted = true; resolve(response); },
      modal: { confirm_close: true, ondismiss: () => { if (!submitted) reject(new Error("Payment window closed. Retry payment or check its status in My Orders.")); } },
      theme: { color: "#e96d32" },
    });
    modal.open();
  });
  return payments.verify(order._id, result);
}
