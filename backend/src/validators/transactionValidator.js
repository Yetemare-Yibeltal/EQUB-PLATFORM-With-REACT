import Joi from "joi";
import {
  TRANSACTION_DIRECTION_VALUES,
  TRANSACTION_TYPE_VALUES,
} from "../constants/transactionTypes.js";

const objectId = Joi.string().hex().length(24);

export const groupTransactionsParamsSchema = Joi.object({
  groupId: objectId.required(),
});

export const listGroupTransactionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  cycleId: objectId,
  userId: objectId,
  type: Joi.string().valid(...TRANSACTION_TYPE_VALUES),
  direction: Joi.string().valid(...TRANSACTION_DIRECTION_VALUES),
  sort: Joi.string().trim().max(100),
});

export const listMyTransactionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  groupId: objectId,
  type: Joi.string().valid(...TRANSACTION_TYPE_VALUES),
  sort: Joi.string().trim().max(100),
});
