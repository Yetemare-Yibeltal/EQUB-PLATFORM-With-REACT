import Joi from "joi";
import { MEMBER_STATUS_VALUES } from "../constants/memberStatuses.js";

const objectId = Joi.string().hex().length(24);

export const memberParamsSchema = Joi.object({
  groupId: objectId.required(),
  memberId: objectId.required(),
});

export const listMembersParamsSchema = Joi.object({
  groupId: objectId.required(),
});

export const listMembersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid(...MEMBER_STATUS_VALUES),
  sort: Joi.string().trim().max(100),
});
