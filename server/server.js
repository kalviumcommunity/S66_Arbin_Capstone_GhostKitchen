import { createServer } from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { initializeSocket } from "./socket/socketServer.js";
import { configDotenv } from "dotenv";

configDotenv();

const app = createApp();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file. Please add it.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET not found in .env file. Please add it.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    console.log("MongoDB connected successfully 🚀");
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT} 🧟`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

initializeSocket(httpServer);
