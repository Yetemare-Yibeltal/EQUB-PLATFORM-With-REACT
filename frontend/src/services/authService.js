import { api } from "./api";

const unwrap = (response) => response.data.data ?? {};

export const authService = {
  register: (payload) => api.post("/auth/register", payload).then(unwrap),

  login: (payload) => api.post("/auth/login", payload).then(unwrap),

  logout: () => api.post("/auth/logout", {}),

  logoutAll: () => api.post("/auth/logout-all", {}),

  changePassword: (payload) =>
    api.post("/auth/change-password", payload).then(unwrap),

  forgotPassword: (payload) =>
    api.post("/auth/forgot-password", payload).then((response) => ({
      message: response.data.message,
      ...unwrap(response),
    })),

  resetPassword: (payload) =>
    api.post("/auth/reset-password", payload).then(unwrap),

  verifyEmail: (payload) =>
    api.post("/auth/verify-email", payload).then(unwrap),

  resendVerification: () =>
    api.post("/auth/resend-verification", {}).then(unwrap),
};