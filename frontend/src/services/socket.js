import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

const url = import.meta.env.VITE_SOCKET_URL || undefined;

export const createSocket = () =>
  io(url, {
    auth: (callback) =>
      callback({ token: useAuthStore.getState().accessToken }),
    transports: ["websocket"],
    reconnectionDelayMax: 10000,
  });
