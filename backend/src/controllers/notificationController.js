import * as notificationService from "../services/notificationService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const { items, meta, unreadCount } = await notificationService.listMine(
    req.user,
    req.query,
  );

  return sendSuccess(res, {
    message: "Notifications retrieved successfully",
    data: { notifications: items, unreadCount },
    meta,
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user);

  return sendSuccess(res, {
    message: "Unread count retrieved successfully",
    data: { unreadCount },
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markRead(
    req.user,
    req.params.notificationId,
  );

  return sendSuccess(res, {
    message: "Notification marked as read",
    data: result,
  });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user);

  return sendSuccess(res, {
    message: "All notifications marked as read",
    data: result,
  });
});

export const removeNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.remove(
    req.user,
    req.params.notificationId,
  );

  return sendSuccess(res, { message: "Notification deleted", data: result });
});
