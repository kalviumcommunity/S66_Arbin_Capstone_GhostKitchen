import express from "express";
import mongoose from "mongoose";
import foodRoutes from "./routes/foodRoutes.js";
import { configDotenv } from "dotenv";
configDotenv();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB connected successfully 🚀"))
.catch((err) => console.error("MongoDB connection failed:", err));

// Routes
app.use("/api/foods", foodRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🧟`);
});
