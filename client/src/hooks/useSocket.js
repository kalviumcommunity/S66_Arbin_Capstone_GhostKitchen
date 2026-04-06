import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setLive = useNotificationStore((state) => state.setLive);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      setLive(false);
      return;
    }

    const socket = connectSocket(token);
    if (!socket) return;

    const onConnect = () => setLive(true);
    const onDisconnect = () => setLive(false);
    const onConnectError = () => setLive(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) {
      setLive(true);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [isAuthenticated, token, setLive]);

  return getSocket();
};
