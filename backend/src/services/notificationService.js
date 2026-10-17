import { emitToUser } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import * as notificationRepository from '../repositories/notificationRepository.js';
import ApiError from '../utils/apiError.js';
import { clip } from '../utils/format.js';
import logger from '../utils/logger.js';
import { parsePagination, parseSort } from '../utils/pagination.js';

const SORTABLE_FIELDS = ['createdAt', 'readAt'];

export const send = async ({
  userId,
  type,
  title,
  message,
  groupId,
  cycleId,
  entityType,
  entityId,
  data = {},
  dedupeKey,
}) => {
  const notification = await notificationRepository.createIfAbsent({
    user: userId,
    type,
    title: clip(title, 150),
    message: clip(message, 500),
    group: groupId,
    cycle: cycleId,
    entityType,
    entityId,
    data,
    dedupeKey,
  });

  if (!notification) return null;

  const unreadCount = await notificationRepository.countUnread(userId);

  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
    notification: notification.toJSON(),
    unreadCount,
  });

  return notification;
};

export const sendToMany = async (userIds, payload) => {
  const uniqueIds = [...new Set(userIds.map(String))];

  const results = await Promise.allSettled(
    uniqueIds.map((userId) => send({ ...payload, userId }))
  );

  results.forEach((result) => {
    if (result.status === 'rejected') {
      logger.error(`Notification delivery failed: ${result.reason?.message}`);
    }
  });

  return results.filter((result) => result.status === 'fulfilled' && result.value).length;
};

export const getUnreadCount = (actor) => notificationRepository.countUnread(actor.id);

export const listMine = async (actor, query = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, '-createdAt');

  const filter = { user: actor.id };

  if (query.unread === true) filter.readAt = null;
  if (query.unread === false) filter.readAt = { $ne: null };
  if (query.type) filter.type = query.type;
  if (query.groupId) filter.group = query.groupId;

  const [{ items, meta }, unreadCount] = await Promise.all([
    notificationRepository.list(filter, { page, limit, skip, sort }),
    notificationRepository.countUnread(actor.id),
  ]);

  return { items: items.map((item) => item.toJSON()), meta, unreadCount };
};

export const markRead = async (actor, notificationId) => {
  const updated = await notificationRepository.markRead(actor.id, notificationId);
  const notification = updated ?? (await notificationRepository.findOwned(actor.id, notificationId));

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  const unreadCount = await notificationRepository.countUnread(actor.id);

  if (updated) {
    emitToUser(actor.id, SOCKET_EVENTS.UNREAD_COUNT, { unreadCount });
  }

  return { notification: notification.toJSON(), unreadCount };
};

export const markAllRead = async (actor) => {
  const result = await notificationRepository.markAllRead(actor.id);

  emitToUser(actor.id, SOCKET_EVENTS.UNREAD_COUNT, { unreadCount: 0 });

  return { updated: result.modifiedCount, unreadCount: 0 };
};

export const remove = async (actor, notificationId) => {
  const deleted = await notificationRepository.deleteOwned(actor.id, notificationId);

  if (!deleted) {
    throw ApiError.notFound('Notification not found');
  }

  const unreadCount = await notificationRepository.countUnread(actor.id);

  emitToUser(actor.id, SOCKET_EVENTS.UNREAD_COUNT, { unreadCount });

  return { unreadCount };
};