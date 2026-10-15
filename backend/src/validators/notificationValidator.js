import Joi from "joi";
import { NOTIFICATION_TYPE_VALUES } from "../constants/notificationTypes.js";

const objectId = Joi.string().hex().length(24);

export const notificationParamSchema = Joi.object({
  notificationId: objectId.required(),
});

export const listNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  unread: Joi.boolean(),
  type: Joi.string().valid(...NOTIFICATION_TYPE_VALUES),
  groupId: objectId,
  sort: Joi.string().trim().max(100),
});
