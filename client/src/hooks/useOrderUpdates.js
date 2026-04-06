import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import { useOrderStore } from "../stores/orderStore";
import { useOwnerOrderStore } from "../stores/ownerOrderStore";
import { useSocket } from "./useSocket";

export const useOrderUpdates = () => {
  const socket = useSocket();
  const user = useAuthStore((state) => state.user);
  const pushNotification = useNotificationStore((state) => state.pushNotification);
  const setOwnerOrders = useOwnerOrderStore((state) => state.setOrdersFromRealtime);
  const upsertOwnerOrder = useOwnerOrderStore((state) => state.upsertOrderFromRealtime);
  const setCustomerOrders = useOrderStore((state) => state.setOrdersFromRealtime);
  const upsertCustomerOrder = useOrderStore((state) => state.upsertOrderFromRealtime);

  useEffect(() => {
    if (!socket || !user?.role) return;

    const onOwnerOrderNew = ({ order, message }) => {
      if (user.role !== "owner") return;
      upsertOwnerOrder(order);
      pushNotification({ type: "order", message: message || "New order received", meta: { orderId: order?._id } });
    };

    const onOwnerOrderUpdated = ({ order, message }) => {
      if (user.role !== "owner") return;
      upsertOwnerOrder(order);
      pushNotification({ type: "order", message: message || "Order updated", meta: { orderId: order?._id } });
    };

    const onCustomerOrderNew = ({ order, message }) => {
      if (user.role !== "customer" && user.role !== "owner") return;
      upsertCustomerOrder(order);
      pushNotification({ type: "order", message: message || "Order placed", meta: { orderId: order?._id } });
    };

    const onCustomerOrderUpdated = ({ order, message }) => {
      if (user.role !== "customer" && user.role !== "owner") return;
      upsertCustomerOrder(order);
      pushNotification({ type: "order", message: message || "Order status updated", meta: { orderId: order?._id } });
    };

    socket.on("owner:order:new", onOwnerOrderNew);
    socket.on("owner:order:updated", onOwnerOrderUpdated);
    socket.on("customer:order:new", onCustomerOrderNew);
    socket.on("customer:order:updated", onCustomerOrderUpdated);

    return () => {
      socket.off("owner:order:new", onOwnerOrderNew);
      socket.off("owner:order:updated", onOwnerOrderUpdated);
      socket.off("customer:order:new", onCustomerOrderNew);
      socket.off("customer:order:updated", onCustomerOrderUpdated);
      if (user.role === "owner") {
        setOwnerOrders([]);
      } else {
        setCustomerOrders([]);
      }
    };
  }, [socket, user, pushNotification, setOwnerOrders, upsertOwnerOrder, setCustomerOrders, upsertCustomerOrder]);
};
