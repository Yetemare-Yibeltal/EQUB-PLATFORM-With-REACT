import Joi from "joi";
import { CONTRIBUTION_FREQUENCY_VALUES } from "../constants/contributionFrequencies.js";
import { GROUP_STATUS_VALUES } from "../constants/groupStatuses.js";
import { MEMBER_ROLE_VALUES } from "../constants/memberRoles.js";
import { MEMBER_STATUS_VALUES } from "../constants/memberStatuses.js";
import { PAYOUT_ORDER_METHOD_VALUES } from "../constants/payoutOrderMethods.js";

const objectId = Joi.string().hex().length(24);

const inviteCodeField = Joi.string()
  .trim()
  .min(6)
  .max(16)
  .pattern(/^[A-Za-z0-9-]+$/)
  .messages({
    "string.pattern.base":
      "Invite code may contain only letters, numbers, and hyphens",
  });

const startDateField = Joi.date()
  .iso()
  .custom((value, helpers) => {
    const now = new Date();
    const startOfTodayUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    return value.getTime() < startOfTodayUtc
      ? helpers.error("any.invalid")
      : value;
  })
  .messages({
    "any.invalid": "Start date cannot be in the past",
    "date.format": "Start date must be a valid ISO date",
  });

const nameField = Joi.string().trim().min(3).max(100);
const descriptionField = Joi.string().trim().max(1000).allow("");
const contributionAmountField = Joi.number().integer().min(100).max(100000000);
const frequencyField = Joi.string().valid(...CONTRIBUTION_FREQUENCY_VALUES);
const maxMembersField = Joi.number().integer().min(2).max(100);
const latePenaltyField = Joi.number().integer().min(0).max(100000000);
const gracePeriodField = Joi.number().integer().min(0).max(30);
const payoutOrderField = Joi.string().valid(...PAYOUT_ORDER_METHOD_VALUES);

export const groupIdParamSchema = Joi.object({
  groupId: objectId.required(),
});

export const inviteCodeParamSchema = Joi.object({
  inviteCode: inviteCodeField.required(),
});

export const createGroupSchema = Joi.object({
  name: nameField.required(),
  description: descriptionField,
  contributionAmount: contributionAmountField.required(),
  frequency: frequencyField.required(),
  maxMembers: maxMembersField.required(),
  startDate: startDateField.required(),
  requireApproval: Joi.boolean(),
  latePenaltyAmount: latePenaltyField
    .max(Joi.ref("contributionAmount"))
    .messages({
      "number.max": "Late penalty cannot exceed the contribution amount",
    }),
  gracePeriodDays: gracePeriodField,
  payoutOrderMethod: payoutOrderField,
});

export const updateGroupSchema = Joi.object({
  name: nameField,
  description: descriptionField,
  contributionAmount: contributionAmountField,
  frequency: frequencyField,
  maxMembers: maxMembersField,
  startDate: startDateField,
  requireApproval: Joi.boolean(),
  latePenaltyAmount: latePenaltyField,
  gracePeriodDays: gracePeriodField,
  payoutOrderMethod: payoutOrderField,
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update" });

export const joinGroupSchema = Joi.object({
  inviteCode: inviteCodeField.required(),
});

export const cancelGroupSchema = Joi.object({
  reason: Joi.string().trim().max(500).allow(""),
});

export const listGroupsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().max(100),
  status: Joi.string().valid(...GROUP_STATUS_VALUES),
  membershipStatus: Joi.string().valid(...MEMBER_STATUS_VALUES),
  role: Joi.string().valid(...MEMBER_ROLE_VALUES),
  sort: Joi.string().trim().max(100),
});
