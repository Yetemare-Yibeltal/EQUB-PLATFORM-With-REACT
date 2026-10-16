import { create } from "zustand";

export const useNotificationStore = create((set) => ({
  unreadCount: 0,
  lastReceived: null,

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  receive: (notification, unreadCount) =>
    set({ lastReceived: notification, unreadCount }),

  reset: () => set({ unreadCount: 0, lastReceived: null }),
}));
