// backend/server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import foodRoutes from "./routes/foodRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/foods", foodRoutes);

// Health route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// DB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables");
  process.exit(1); // Safe exit if no DB string
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected 🧟");
    app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
  })
  .catch((error) => {
    console.error("❌ Failed to connect MongoDB:", process.env.NODE_ENV === "production" ? "Database connection error" : error.message);
    process.exit(1); // Exit only at startup (prevents running without DB)
  });
