import Joi from "joi";
import { CONTRIBUTION_STATUS_VALUES } from "../constants/contributionStatuses.js";
import { MANUAL_PAYMENT_METHOD_VALUES } from "../constants/paymentMethods.js";

const objectId = Joi.string().hex().length(24);

export const groupContributionsParamsSchema = Joi.object({
  groupId: objectId.required(),
});

export const contributionParamsSchema = Joi.object({
  groupId: objectId.required(),
  contributionId: objectId.required(),
});

export const listContributionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  cycleId: objectId,
  userId: objectId,
  status: Joi.string().valid(...CONTRIBUTION_STATUS_VALUES),
  overdue: Joi.boolean(),
  sort: Joi.string().trim().max(100),
});

export const listMyContributionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  groupId: objectId,
  status: Joi.string().valid(...CONTRIBUTION_STATUS_VALUES),
  overdue: Joi.boolean(),
  sort: Joi.string().trim().max(100),
});

export const recordContributionSchema = Joi.object({
  paymentMethod: Joi.string()
    .valid(...MANUAL_PAYMENT_METHOD_VALUES)
    .required(),
  reference: Joi.string().trim().max(100).allow(""),
  note: Joi.string().trim().max(500).allow(""),
  paidAt: Joi.date().iso().max("now").messages({
    "date.max": "Payment time cannot be in the future",
  }),
});

export const waiveContributionSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required(),
});
