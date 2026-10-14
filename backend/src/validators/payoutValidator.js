import Joi from "joi";
import { MANUAL_PAYMENT_METHOD_VALUES } from "../constants/paymentMethods.js";
import { PAYOUT_STATUS_VALUES } from "../constants/payoutStatuses.js";

const objectId = Joi.string().hex().length(24);

export const groupPayoutsParamsSchema = Joi.object({
  groupId: objectId.required(),
});

export const payoutParamsSchema = Joi.object({
  groupId: objectId.required(),
  payoutId: objectId.required(),
});

export const listGroupPayoutsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  cycleId: objectId,
  status: Joi.string().valid(...PAYOUT_STATUS_VALUES),
  sort: Joi.string().trim().max(100),
});

export const listMyPayoutsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  groupId: objectId,
  status: Joi.string().valid(...PAYOUT_STATUS_VALUES),
  sort: Joi.string().trim().max(100),
});

export const recordPayoutSchema = Joi.object({
  paymentMethod: Joi.string()
    .valid(...MANUAL_PAYMENT_METHOD_VALUES)
    .required(),
  reference: Joi.string().trim().max(100).allow(""),
  note: Joi.string().trim().max(500).allow(""),
  paidAt: Joi.date().iso().max("now").messages({
    "date.max": "Payment time cannot be in the future",
  }),
});
