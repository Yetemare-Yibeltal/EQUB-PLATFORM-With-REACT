import { userRoom } from "../config/socket.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import { USER_STATUSES } from "../constants/userStatuses.js";
import * as userRepository from "../repositories/userRepository.js";
import { verifyAccessToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import { registerDrawHandlers } from "./drawSocket.js";
import { registerNotificationHandlers } from "./notificationSocket.js";

const MAX_TIMER_MS = 2147483647;

const extractToken = (socket) => {
  const fromAuth = socket.handshake.auth?.token;

  if (typeof fromAuth === "string" && fromAuth) {
    return fromAuth;
  }

  const header = socket.handshake.headers?.authorization;

  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return null;
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = extractToken(socket);

    if (!token) {
      return next(new Error("Authentication token is missing"));
    }

    const payload = verifyAccessToken(token);

    const user = await userRepository.findById(payload.sub, {
      select: "role status passwordChangedAt",
      lean: true,
    });

    if (!user || user.status !== USER_STATUSES.ACTIVE) {
      return next(new Error("Account is not available"));
    }

    if (user.passwordChangedAt) {
      const changedAtSeconds = Math.floor(
        user.passwordChangedAt.getTime() / 1000,
      );

      if (changedAtSeconds > payload.iat) {
        return next(
          new Error("Password was changed recently, please log in again"),
        );
      }
    }

    socket.data.user = { id: String(user._id), role: user.role };
    socket.data.expiresAt = payload.exp * 1000;

    return next();
  } catch {
    return next(new Error("Invalid or expired token"));
  }
};

export const registerSocketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { user, expiresAt } = socket.data;

    socket.join(userRoom(user.id));

    const expiryTimer = setTimeout(
      () => {
        socket.emit(SOCKET_EVENTS.AUTH_EXPIRED);
        socket.disconnect(true);
      },
      Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMER_MS),
    );

    socket.on("disconnect", () => clearTimeout(expiryTimer));

    registerNotificationHandlers(socket);
    registerDrawHandlers(socket);

    logger.debug(`Socket connected for user ${user.id}`);
  });
};
