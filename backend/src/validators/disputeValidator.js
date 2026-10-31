import Joi from "joi";
import { DISPUTE_CATEGORY_VALUES } from "../constants/disputeCategories.js";
import {
  DISPUTE_STATUSES,
  DISPUTE_STATUS_VALUES,
} from "../constants/disputeStatuses.js";

const objectId = Joi.string().hex().length(24);

export const groupDisputesParamSchema = Joi.object({
  groupId: objectId.required(),
});

export const groupDisputeParamsSchema = Joi.object({
  groupId: objectId.required(),
  disputeId: objectId.required(),
});

export const disputeIdParamSchema = Joi.object({
  disputeId: objectId.required(),
});

export const createDisputeSchema = Joi.object({
  category: Joi.string()
    .valid(...DISPUTE_CATEGORY_VALUES)
    .required(),
  subject: Joi.string().trim().min(3).max(120).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  cycleId: objectId,
  againstUserId: objectId,
});

export const addDisputeCommentSchema = Joi.object({
  body: Joi.string().trim().min(1).max(1000).required(),
});

export const decideDisputeSchema = Joi.object({
  status: Joi.string()
    .valid(
      DISPUTE_STATUSES.IN_REVIEW,
      DISPUTE_STATUSES.RESOLVED,
      DISPUTE_STATUSES.DISMISSED,
    )
    .required(),
  resolution: Joi.string()
    .trim()
    .max(1000)
    .when("status", {
      is: Joi.valid(DISPUTE_STATUSES.RESOLVED, DISPUTE_STATUSES.DISMISSED),
      then: Joi.string().min(3).required(),
      otherwise: Joi.string().allow("").optional(),
    }),
});

export const listDisputesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().valid(
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
  ),
  status: Joi.string().valid(...DISPUTE_STATUS_VALUES),
  category: Joi.string().valid(...DISPUTE_CATEGORY_VALUES),
  groupId: objectId,
});
