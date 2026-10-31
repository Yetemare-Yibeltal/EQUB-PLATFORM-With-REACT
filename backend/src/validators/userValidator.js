import Joi from "joi";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { USER_ROLE_VALUES } from "../constants/roles.js";
import { USER_STATUS_VALUES } from "../constants/userStatuses.js";
import { emailField, fullNameField } from "./authValidator.js";

const objectId = Joi.string().hex().length(24);

export const userIdParamSchema = Joi.object({
  userId: objectId.required(),
});

export const updateProfileSchema = Joi.object({
  fullName: fullNameField,
  email: emailField.allow(null),
  avatarUrl: Joi.string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .max(500)
    .allow(""),
  language: Joi.string().valid(...LANGUAGE_VALUES),
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update" });

export const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().max(100),
  role: Joi.string().valid(...USER_ROLE_VALUES),
  status: Joi.string().valid(...USER_STATUS_VALUES),
  sort: Joi.string().trim().max(100),
});

export const updateUserStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...USER_STATUS_VALUES)
    .required(),
});

export const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...USER_ROLE_VALUES)
    .required(),
});
