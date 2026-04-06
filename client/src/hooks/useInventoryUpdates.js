import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useInventoryStore } from "../stores/inventoryStore";
import { useNotificationStore } from "../stores/notificationStore";
import { useSocket } from "./useSocket";

export const useInventoryUpdates = () => {
  const socket = useSocket();
  const user = useAuthStore((state) => state.user);
  const fetchInventory = useInventoryStore((state) => state.fetchInventory);
  const pushNotification = useNotificationStore((state) => state.pushNotification);

  useEffect(() => {
    if (!socket || user?.role !== "owner") return;

    const onInventoryChanged = (payload) => {
      fetchInventory();
      pushNotification({
        type: "inventory",
        message: payload?.source === "order_placed" ? "Inventory changed from new order" : "Inventory updated",
      });
    };

    socket.on("inventory:changed", onInventoryChanged);

    return () => {
      socket.off("inventory:changed", onInventoryChanged);
    };
  }, [socket, user, fetchInventory, pushNotification]);
};
