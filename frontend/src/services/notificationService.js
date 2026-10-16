import { api } from "./api";

const unwrap = (response) => response.data.data;

export const notificationService = {
  list: (params = {}) =>
    api.get("/notifications", { params }).then((response) => ({
      notifications: response.data.data.notifications,
      unreadCount: response.data.data.unreadCount,
      meta: response.data.meta,
    })),

  unreadCount: () =>
    api
      .get("/notifications/unread-count")
      .then((response) => response.data.data.unreadCount),

  markRead: (id) => api.post(`/notifications/${id}/read`).then(unwrap),

  markAllRead: () => api.post("/notifications/read-all").then(unwrap),

  remove: (id) => api.delete(`/notifications/${id}`).then(unwrap),
};
