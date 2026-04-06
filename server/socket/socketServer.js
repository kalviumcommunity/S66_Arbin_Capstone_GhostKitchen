import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "../models/userModel.js";

let ioInstance = null;

const getTokenFromSocket = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const authHeader = socket.handshake.headers?.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

export const initializeSocket = (server) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  ioInstance = new Server(server, {
    cors: {
      origin: frontendUrl,
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        return next(new Error("Not authorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return next(new Error("Not authorized"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Not authorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);
    socket.join(`role:${socket.user.role}`);

    socket.on("join-order-room", (orderId) => {
      if (!orderId) return;
      socket.join(`order:${String(orderId)}`);
    });
  });

  return ioInstance;
};

export const getIo = () => ioInstance;

export const emitToOwners = (eventName, payload) => {
  if (!ioInstance) return;
  ioInstance.to("role:owner").emit(eventName, payload);
};

export const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${String(userId)}`).emit(eventName, payload);
};
