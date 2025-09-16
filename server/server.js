import express from "express";
import foodRoutes from "./routes/foodRoutes.js";
import { configDotenv } from "dotenv";
configDotenv();

const app = express();
const PORT = process.env.PORT || 5000; // ✅ kept fallback port

app.use(express.json());

// Routes
app.use("/api/foods", foodRoutes);

// Server start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
