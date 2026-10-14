import Joi from "joi";
import { PAYMENT_STATUS_VALUES } from "../constants/paymentStatuses.js";

const objectId = Joi.string().hex().length(24);
const txRefField = Joi.string()
  .trim()
  .pattern(/^[A-Za-z0-9_-]{8,64}$/)
  .messages({ "string.pattern.base": "Transaction reference is invalid" });

export const checkoutSchema = Joi.object({
  groupId: objectId.required(),
  contributionId: objectId.required(),
});

export const txRefParamSchema = Joi.object({
  txRef: txRefField.required(),
});

export const callbackQuerySchema = Joi.object({
  tx_ref: txRefField,
  trx_ref: txRefField,
  ref_id: Joi.string().trim().max(200),
  status: Joi.string().trim().max(50),
});

export const listMyPaymentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  groupId: objectId,
  status: Joi.string().valid(...PAYMENT_STATUS_VALUES),
  sort: Joi.string().trim().max(100),
});

export const listPaymentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  groupId: objectId,
  userId: objectId,
  status: Joi.string().valid(...PAYMENT_STATUS_VALUES),
  requiresReview: Joi.boolean(),
  sort: Joi.string().trim().max(100),
});
