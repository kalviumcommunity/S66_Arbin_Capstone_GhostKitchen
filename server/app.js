import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import procurementRoutes from "./routes/procurementRoutes.js";
import { createPaymentRouter, paymentWebhook } from "./routes/paymentRoutes.js";
import { createPaymentService } from "./services/paymentService.js";

export function createApp({ gateway } = {}) {
  const app = express();
  app.locals.payments = createPaymentService(gateway);
  app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
  // Signature verification must see the original bytes, before the JSON parser.
  app.post("/api/payments/webhook", express.raw({ type: "application/json", limit: "256kb" }), paymentWebhook);
  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());
  app.use("/api/foods", foodRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/procurement", procurementRoutes);
  app.use("/api/payments", createPaymentRouter(app.locals.payments));
  app.get("/", (req, res) => res.json("API is running..."));
  return app;
}
