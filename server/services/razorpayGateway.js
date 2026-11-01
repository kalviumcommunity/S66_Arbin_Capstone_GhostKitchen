import { createHmac, timingSafeEqual } from "node:crypto";
import { OrderError } from "./orderPolicy.js";

export function assertRazorpayConfigured() {
  if (!process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") || !process.env.RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new OrderError(503, "Online payments are not configured. Use cash on delivery or contact the kitchen.");
  }
}

export function verifySignature(data, signature, secret) {
  if (!secret || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(data).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

async function call(path, { method = "GET", body } = {}) {
  assertRazorpayConfigured();
  try {
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method, signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new OrderError(502, "The payment provider could not complete this request. Retry or contact the kitchen.");
    return await response.json();
  } catch (error) {
    if (error.status) throw error;
    throw new OrderError(502, "The payment provider is temporarily unavailable. Your payment status will be reconciled safely.");
  }
}

export const razorpayGateway = {
  assertConfigured: assertRazorpayConfigured,
  keyId: () => process.env.RAZORPAY_KEY_ID,
  findOrder: async (receipt) => (await call(`/orders?receipt=${encodeURIComponent(receipt)}&count=100`)).items?.find((item) => item.receipt === receipt),
  createOrder: (body) => call("/orders", { method: "POST", body }),
  fetchOrder: (id) => call(`/orders/${encodeURIComponent(id)}`),
  fetchPayment: (id) => call(`/payments/${encodeURIComponent(id)}`),
  orderPayments: async (id) => (await call(`/orders/${encodeURIComponent(id)}/payments`)).items || [],
  refunds: async (paymentId) => {
    const items = [];
    for (let skip = 0; ; skip += 100) {
      const page = (await call(`/payments/${encodeURIComponent(paymentId)}/refunds?count=100&skip=${skip}`)).items || [];
      items.push(...page);
      if (page.length < 100) return items;
    }
  },
  createRefund: (id, body) => call(`/payments/${encodeURIComponent(id)}/refund`, { method: "POST", body }),
  fetchRefund: (id) => call(`/refunds/${encodeURIComponent(id)}`),
};
