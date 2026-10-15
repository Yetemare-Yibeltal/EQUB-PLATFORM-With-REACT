import Joi from "joi";
import { GROUP_STATUS_VALUES } from "../constants/groupStatuses.js";

const objectId = Joi.string().hex().length(24);

export const listAdminGroupsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().max(100),
  status: Joi.string().valid(...GROUP_STATUS_VALUES),
  sort: Joi.string().trim().max(100),
});

export const paymentIdParamSchema = Joi.object({
  paymentId: objectId.required(),
});

export const resolvePaymentReviewSchema = Joi.object({
  note: Joi.string().trim().min(3).max(300).required(),
});

export const jobNameParamSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[a-z][a-z0-9-]{2,49}$/)
    .required()
    .messages({ "string.pattern.base": "Job name is invalid" }),
});
