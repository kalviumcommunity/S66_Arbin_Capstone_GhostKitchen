// backend/server.js
import express from "express";
import mongoose from "mongoose";
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // ✅ Added user routes
import { configDotenv } from "dotenv";

configDotenv();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());

// ✅ Guard: check for missing MONGO_URI
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file. Please add it before starting the server.");
  process.exit(1); // Stop the server immediately
}

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully 🚀"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1); // Exit if DB connection fails
  });

// Routes
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes); // ✅ Register, Login, Logout


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🧟`);
});
