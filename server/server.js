// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser"; // ✅ needed for cookies
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // ✅ for register/login/logout
import { configDotenv } from "dotenv";

configDotenv();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ✅ Middleware
app.use(express.json());
app.use(cookieParser()); // 👈 ensures cookies can be read/written

// ✅ Guard: check for missing ENV
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file. Please add it.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET not found in .env file. Please add it.");
  process.exit(1);
}

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully 🚀"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

// Routes
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes); // ✅ added

// Default route
app.get("/", (req, res) => {
  res.json("API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🧟`);
});
