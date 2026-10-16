import axios from "axios";
import { useAuthStore } from "../store/authStore";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;

export const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh", {})
      .then(({ data }) => {
        const { user, accessToken } = data.data;
        useAuthStore.getState().setSession({ user, accessToken });
        return accessToken;
      })
      .catch((error) => {
        const status = error.response?.status;

        if (status === 401 || status === 403) {
          useAuthStore.getState().clearSession();
        }

        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const skip =
      !original ||
      original._retried ||
      NO_REFRESH_PATHS.some((path) => original.url?.startsWith(path));

    if (error.response?.status !== 401 || skip) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      const token = await refreshSession();
      original.headers.Authorization = `Bearer ${token}`;
      return await api(original);
    } catch {
      return Promise.reject(error);
    }
  },
);
