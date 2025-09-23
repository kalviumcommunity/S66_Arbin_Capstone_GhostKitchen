// backend/server.js
import express from "express";
import mongoose from "mongoose";
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // ✅ added user routes
import cookieParser from "cookie-parser"; // ✅ for JWT cookies
import { configDotenv } from "dotenv";
configDotenv();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());
app.use(cookieParser()); // ✅ add cookie parser

// ✅ Guard: check for missing MONGO_URI
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file. Please add it before starting the server.");
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
app.use("/api/users", userRoutes); // ✅ new user routes

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🧟`);
});
