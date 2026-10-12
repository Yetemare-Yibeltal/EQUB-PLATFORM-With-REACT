import Joi from "joi";
import { normalizePhone } from "../utils/phone.js";

const emailOnly = Joi.string().email({ tlds: { allow: false } });

export const fullNameField = Joi.string()
  .trim()
  .min(2)
  .max(100)
  .pattern(/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u)
  .messages({
    "string.pattern.base":
      "Full name may contain only letters, spaces, apostrophes, periods, and hyphens",
  });

export const phoneField = Joi.string()
  .trim()
  .custom(
    (value, helpers) => normalizePhone(value) || helpers.error("any.invalid"),
  )
  .messages({ "any.invalid": "Enter a valid Ethiopian mobile number" });

export const emailField = Joi.string()
  .trim()
  .lowercase()
  .max(254)
  .email({ tlds: { allow: false } });

export const passwordField = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[A-Za-z]/)
  .pattern(/\d/)
  .messages({
    "string.pattern.base":
      "Password must contain at least one letter and one number",
  });

export const identifierField = Joi.string()
  .trim()
  .max(254)
  .custom((value, helpers) => {
    if (value.includes("@")) {
      const normalizedEmail = value.toLowerCase();
      return emailOnly.validate(normalizedEmail).error
        ? helpers.error("any.invalid")
        : normalizedEmail;
    }
    return normalizePhone(value) || helpers.error("any.invalid");
  })
  .messages({ "any.invalid": "Enter a valid phone number or email address" });

export const registerSchema = Joi.object({
  fullName: fullNameField.required(),
  phone: phoneField.required(),
  email: emailField.empty("").optional(),
  password: passwordField.required(),
});

export const loginSchema = Joi.object({
  identifier: identifierField.required(),
  password: Joi.string().max(72).required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().max(2048),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().max(72).required(),
  newPassword: passwordField.required(),
});

export const forgotPasswordSchema = Joi.object({
  identifier: identifierField.required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  newPassword: passwordField.required(),
});
