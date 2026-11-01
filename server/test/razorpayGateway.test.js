import assert from "node:assert/strict";
import { test } from "node:test";
import { razorpayGateway } from "../services/razorpayGateway.js";

test("the real gateway adapter stays disabled until all test-mode credentials are present", () => {
  process.env.RAZORPAY_KEY_ID = "rzp_live_rejected";
  process.env.RAZORPAY_KEY_SECRET = "disposable-secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "disposable-webhook";
  assert.throws(() => razorpayGateway.assertConfigured(), { status: 503 });
  process.env.RAZORPAY_KEY_ID = "rzp_test_disposable";
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  assert.throws(() => razorpayGateway.assertConfigured(), { status: 503 });
  process.env.RAZORPAY_WEBHOOK_SECRET = "disposable-webhook";
  assert.doesNotThrow(() => razorpayGateway.assertConfigured());
});

test("the real gateway uses server credentials and hides provider error details", async (context) => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_disposable";
  process.env.RAZORPAY_KEY_SECRET = "disposable-secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "disposable-webhook";
  let request;
  const mock = context.mock.method(globalThis, "fetch", async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ id: "order_test", amount: 2470, currency: "INR" }), { status: 200 });
  });
  await razorpayGateway.createOrder({ amount: 2470, currency: "INR", receipt: "gk_test" });
  assert.equal(request.url, "https://api.razorpay.com/v1/orders");
  assert.equal(request.options.headers.Authorization, `Basic ${Buffer.from("rzp_test_disposable:disposable-secret").toString("base64")}`);
  assert.equal(JSON.parse(request.options.body).amount, 2470);
  mock.mock.mockImplementation(async () => new Response(JSON.stringify({ error: { description: "raw-provider-secret" } }), { status: 400 }));
  await assert.rejects(razorpayGateway.createOrder({ amount: 2470 }), (error) => error.status === 502 && !error.message.includes("raw-provider-secret"));
});
