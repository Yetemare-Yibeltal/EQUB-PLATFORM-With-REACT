import { api } from "./api";

const unwrap = (response) => response.data.data;

export const userService = {
  getMe: () => api.get("/users/me").then(unwrap),

  updateMe: (payload) => api.patch("/users/me", payload).then(unwrap),
};
