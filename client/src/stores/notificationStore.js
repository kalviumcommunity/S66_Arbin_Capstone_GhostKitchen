import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLive: false,
  browserNotifications: typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted",

  pushNotification: (payload) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const notification = {
      id,
      message: payload?.message || "New update",
      type: payload?.type || "info",
      createdAt: new Date().toISOString(),
      meta: payload?.meta,
    };

    set((state) => ({
      notifications: [{ ...notification, read: false }, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));

    if (typeof window !== "undefined") {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.frequency.value = 720;
          gain.gain.setValueAtTime(0.04, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start();
          oscillator.stop(context.currentTime + 0.18);
          oscillator.addEventListener("ended", () => context.close());
        }
      } catch {
        // Browsers can block audio until the user interacts with the page.
      }

      if (get().browserNotifications && document.visibilityState === "hidden") {
        new Notification("Ghost Kitchen", { body: notification.message });
      }
    }

    setTimeout(() => {
      get().dismissNotification(id);
    }, 5000);
  },

  dismissNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((item) => item.id === id);
      return {
        notifications: state.notifications.filter((item) => item.id !== id),
        unreadCount: notification?.read ? state.unreadCount : Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllRead: () => set((state) => ({ notifications: state.notifications.map((notification) => ({ ...notification, read: true })), unreadCount: 0 })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
  requestBrowserNotifications: async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    set({ browserNotifications: enabled });
    return enabled;
  },
  setLive: (isLive) => set({ isLive }),
}));
