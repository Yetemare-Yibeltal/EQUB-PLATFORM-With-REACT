import Joi from "joi";
import { CONTRIBUTION_STATUS_VALUES } from "../constants/contributionStatuses.js";

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

export const waiveContributionSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required(),
});
