import { useAuthStore } from "../stores/authStore";
import { useInventoryUpdates } from "../hooks/useInventoryUpdates";
import { useOrderUpdates } from "../hooks/useOrderUpdates";

export default function RealtimeBridge() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useOrderUpdates();
  useInventoryUpdates();

  if (!isAuthenticated) return null;

  return null;
}
