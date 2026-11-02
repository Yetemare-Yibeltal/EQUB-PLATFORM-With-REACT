import Joi from "joi";
import { PAYMENT_PROOF_METHOD_VALUES } from "../constants/paymentProofMethods.js";
import { PAYMENT_PROOF_STATUS_VALUES } from "../constants/paymentProofStatuses.js";

const objectId = Joi.string().hex().length(24);

export const groupProofsParamSchema = Joi.object({
  groupId: objectId.required(),
});

export const contributionProofParamsSchema = Joi.object({
  groupId: objectId.required(),
  contributionId: objectId.required(),
});

export const proofParamsSchema = Joi.object({
  groupId: objectId.required(),
  proofId: objectId.required(),
});

export const proofIdParamSchema = Joi.object({
  proofId: objectId.required(),
});

export const submitProofSchema = Joi.object({
  method: Joi.string()
    .valid(...PAYMENT_PROOF_METHOD_VALUES)
    .required(),
  reference: Joi.string()
    .trim()
    .min(4)
    .max(100)
    .pattern(/^[A-Za-z0-9\-_/ ]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Reference may contain only letters, numbers, spaces, - _ and /",
    }),
  note: Joi.string().trim().max(300).allow(""),
});

export const rejectProofSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(300).required(),
});

export const listProofsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().valid("createdAt", "-createdAt"),
  status: Joi.string().valid(...PAYMENT_PROOF_STATUS_VALUES),
  groupId: objectId,
});
