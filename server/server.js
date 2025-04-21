import express from "express";
import foodRoutes from "./routes/foodRoutes.js";
import { configDotenv } from "dotenv";
configDotenv();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

// Routes
app.use("/api/foods", foodRoutes);

// Catch-all route
// app.use("*", (req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
