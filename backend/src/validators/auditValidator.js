import Joi from "joi";
import { AUDIT_ACTION_VALUES } from "../constants/auditActions.js";

const objectId = Joi.string().hex().length(24);

const baseQuery = {
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  actorId: objectId,
  action: Joi.string().valid(...AUDIT_ACTION_VALUES),
  entityType: Joi.string().trim().max(50),
  entityId: objectId,
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  sort: Joi.string().trim().max(100),
};

export const listAuditLogsQuerySchema = Joi.object({
  ...baseQuery,
  groupId: objectId,
});

export const listGroupAuditLogsQuerySchema = Joi.object(baseQuery);

export const groupAuditParamsSchema = Joi.object({
  groupId: objectId.required(),
});
