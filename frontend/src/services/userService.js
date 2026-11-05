import { api } from "./api";

const unwrap = (response) => response.data.data;

export const userService = {
  getMe: () => api.get("/users/me").then(unwrap),

  updateMe: (payload) => api.patch("/users/me", payload).then(unwrap),

  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);

    return api
      .put("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      })
      .then(unwrap);
  },

  removeAvatar: () => api.delete("/users/me/avatar").then(unwrap),

  list: (params = {}) =>
    api.get("/users", { params }).then((response) => ({
      users: response.data.data.users,
      meta: response.data.meta,
    })),

  setStatus: (userId, status) =>
    api
      .patch(`/users/${userId}/status`, { status })
      .then((response) => unwrap(response).user),

  setRole: (userId, role) =>
    api
      .patch(`/users/${userId}/role`, { role })
      .then((response) => unwrap(response).user),
};
