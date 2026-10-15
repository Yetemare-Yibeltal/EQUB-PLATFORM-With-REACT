import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import * as notificationService from "../services/notificationService.js";
import logger from "../utils/logger.js";
import { failure, isObjectId, normalizeArgs } from "./helpers.js";

export const registerNotificationHandlers = (socket) => {
  const actor = socket.data.user;

  notificationService
    .getUnreadCount(actor)
    .then((unreadCount) =>
      socket.emit(SOCKET_EVENTS.UNREAD_COUNT, { unreadCount }),
    )
    .catch((error) =>
      logger.error(`Initial unread count failed: ${error.message}`),
    );

  socket.on(SOCKET_EVENTS.GET_UNREAD, async (payload, ack) => {
    const { reply } = normalizeArgs(payload, ack);

    try {
      reply({
        ok: true,
        unreadCount: await notificationService.getUnreadCount(actor),
      });
    } catch (error) {
      reply(failure(error));
    }
  });

  socket.on(SOCKET_EVENTS.MARK_READ, async (payload, ack) => {
    const { data, reply } = normalizeArgs(payload, ack);

    if (!isObjectId(data?.notificationId)) {
      reply({ ok: false, message: "Invalid notification id" });
      return;
    }

    try {
      const result = await notificationService.markRead(
        actor,
        data.notificationId,
      );
      reply({ ok: true, unreadCount: result.unreadCount });
    } catch (error) {
      reply(failure(error));
    }
  });
};
