const INTERNATIONAL_PHONE = /^(?:\+|00)?251([79]\d{8})$/;
const LOCAL_PHONE = /^0([79]\d{8})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u;
const RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export const normalizePhone = (value) => {
  if (typeof value !== "string") return null;

  const cleaned = value.replace(/[\s\-().]/g, "");
  const match =
    cleaned.match(INTERNATIONAL_PHONE) || cleaned.match(LOCAL_PHONE);

  return match ? `+251${match[1]}` : null;
};

export const validateFullName = (input) => {
  const value = input.trim();

  if (!value) return "Full name is required";
  if (value.length < 2) return "Full name must be at least 2 characters";
  if (value.length > 100) return "Full name must not exceed 100 characters";
  if (!NAME_PATTERN.test(value)) {
    return "Full name may contain only letters, spaces, apostrophes, periods, and hyphens";
  }

  return "";
};

export const validatePhone = (input) => {
  if (!input.trim()) return "Phone number is required";

  return normalizePhone(input) ? "" : "Enter a valid Ethiopian mobile number";
};

export const validateOptionalEmail = (input) => {
  const value = input.trim();

  if (!value) return "";
  if (value.length > 254) return "Email must not exceed 254 characters";

  return EMAIL_PATTERN.test(value) ? "" : "Enter a valid email address";
};

export const validateIdentifier = (input) => {
  const value = input.trim();

  if (!value) return "Phone number or email is required";

  if (value.includes("@")) {
    return EMAIL_PATTERN.test(value)
      ? ""
      : "Enter a valid phone number or email address";
  }

  return normalizePhone(value)
    ? ""
    : "Enter a valid phone number or email address";
};

export const validatePassword = (input) => {
  if (!input) return "Password is required";
  if (input.length < 8) return "Password must be at least 8 characters";
  if (input.length > 72) return "Password must not exceed 72 characters";
  if (!/[A-Za-z]/.test(input) || !/\d/.test(input)) {
    return "Password must contain at least one letter and one number";
  }

  return "";
};

export const validatePasswordConfirmation = (password, confirmation) => {
  if (!confirmation) return "Confirm your password";

  return password === confirmation ? "" : "Passwords do not match";
};

export const validateResetToken = (input) => {
  const value = input.trim();

  if (!value) return "Reset code is required";

  return RESET_TOKEN_PATTERN.test(value)
    ? ""
    : "Reset code must be 64 hexadecimal characters";
};

export const hasErrors = (errors) => Object.values(errors).some(Boolean);
