import { io } from "socket.io-client";

let socketClient = null;

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  if (apiUrl.endsWith("/api")) {
    return apiUrl.slice(0, -4);
  }
  return apiUrl;
};

export const connectSocket = (token) => {
  if (!token) return null;

  if (socketClient) {
    socketClient.auth = { token };
    if (!socketClient.connected) {
      socketClient.connect();
    }
    return socketClient;
  }

  socketClient = io(getSocketUrl(), {
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socketClient;
};

export const getSocket = () => socketClient;

export const disconnectSocket = () => {
  if (!socketClient) return;
  socketClient.disconnect();
  socketClient = null;
};
