import crypto from "node:crypto";
import { USER_STATUSES } from "../constants/userStatuses.js";
import * as userRepository from "../repositories/userRepository.js";
import ApiError from "../utils/apiError.js";
import {
  generateRandomToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import * as emailService from "./emailService.js";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

let dummyHashPromise = null;

const getDummyHash = () => {
  dummyHashPromise ??= hashPassword(crypto.randomBytes(16).toString("hex"));
  return dummyHashPromise;
};

const truncate = (value, max) => String(value || "").slice(0, max);

const invalidCredentials = () =>
  ApiError.unauthorized("Invalid phone, email, or password");

const deliver = (promise) => {
  promise.catch((error) =>
    logger.error(`Email delivery failed: ${error.message}`),
  );
};

const issueEmailVerification = async (user) => {
  const token = generateRandomToken(32);

  await userRepository.setEmailVerificationToken(
    user._id,
    hashToken(token),
    new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  );

  deliver(emailService.sendVerificationEmail({ user, token }));
};

const issueTokens = async (user, meta = {}) => {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, expiresAt } = signRefreshToken(user);

  await userRepository.addRefreshToken(user._id, {
    tokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: truncate(meta.userAgent, 500),
    ipAddress: truncate(meta.ip, 100),
  });

  return { accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
};

const registerFailedAttempt = async (user) => {
  const updated = await userRepository.incrementFailedLogin(user._id);

  if (updated && updated.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    await userRepository.lockAccount(
      user._id,
      new Date(Date.now() + LOCK_DURATION_MS),
    );
  }
};

export const register = async (
  { fullName, phone, email, password },
  meta = {},
) => {
  const [phoneTaken, emailTaken] = await Promise.all([
    userRepository.existsByPhone(phone),
    email ? userRepository.existsByEmail(email) : false,
  ]);

  if (phoneTaken) {
    throw ApiError.conflict("Phone number is already registered", [
      { field: "phone", message: "Phone number is already registered" },
    ]);
  }

  if (emailTaken) {
    throw ApiError.conflict("Email is already registered", [
      { field: "email", message: "Email is already registered" },
    ]);
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.create({
    fullName,
    phone,
    email,
    passwordHash,
  });
  const tokens = await issueTokens(user, meta);

  if (user.email) {
    await issueEmailVerification(user).catch((error) =>
      logger.error(`Email verification setup failed: ${error.message}`),
    );
  }

  return { user, ...tokens };
};

export const login = async ({ identifier, password }, meta = {}) => {
  const user = await userRepository.findByIdentifier(identifier, {
    includePassword: true,
  });

  if (!user) {
    await comparePassword(password, await getDummyHash());
    throw invalidCredentials();
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw ApiError.tooManyRequests(
      "Account is temporarily locked after too many failed attempts, please try again later",
    );
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    await registerFailedAttempt(user);
    throw invalidCredentials();
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw ApiError.forbidden(
      "Your account has been suspended, please contact support",
    );
  }

  const updatedUser = await userRepository.recordSuccessfulLogin(user._id);
  const tokens = await issueTokens(updatedUser, meta);

  return { user: updatedUser, ...tokens };
};

export const refresh = async (refreshToken, meta = {}) => {
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token is required");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await userRepository.consumeRefreshToken(
    payload.sub,
    hashToken(refreshToken),
  );

  if (!user) {
    await userRepository.clearRefreshTokens(payload.sub);
    throw ApiError.unauthorized(
      "Refresh token is no longer valid, please log in again",
    );
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    await userRepository.clearRefreshTokens(user._id);
    throw ApiError.forbidden(
      "Your account has been suspended, please contact support",
    );
  }

  const tokens = await issueTokens(user, meta);

  return { user, ...tokens };
};

export const logout = async (refreshToken) => {
  if (!refreshToken) return;

  try {
    const payload = verifyRefreshToken(refreshToken);
    await userRepository.removeRefreshToken(
      payload.sub,
      hashToken(refreshToken),
    );
  } catch {
    return;
  }
};

export const logoutAll = async (userId) => {
  await userRepository.clearRefreshTokens(userId);
};

export const changePassword = async (
  userId,
  { currentPassword, newPassword },
  meta = {},
) => {
  const user = await userRepository.findByIdWithPassword(userId);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const currentMatches = await comparePassword(
    currentPassword,
    user.passwordHash,
  );

  if (!currentMatches) {
    throw ApiError.badRequest("Current password is incorrect", [
      { field: "currentPassword", message: "Current password is incorrect" },
    ]);
  }

  const reusesPassword = await comparePassword(newPassword, user.passwordHash);

  if (reusesPassword) {
    throw ApiError.badRequest(
      "New password must be different from the current password",
      [
        {
          field: "newPassword",
          message: "New password must be different from the current password",
        },
      ],
    );
  }

  const passwordHash = await hashPassword(newPassword);

  const updatedUser = await userRepository.updateById(userId, {
    $set: { passwordHash, passwordChangedAt: new Date(), refreshTokens: [] },
  });

  const tokens = await issueTokens(updatedUser, meta);

  return { user: updatedUser, ...tokens };
};

export const requestPasswordReset = async (identifier) => {
  const user = await userRepository.findByIdentifier(identifier);

  if (!user || user.status !== USER_STATUSES.ACTIVE) {
    return null;
  }

  const resetToken = generateRandomToken(32);

  await userRepository.setPasswordResetToken(
    user._id,
    hashToken(resetToken),
    new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  );

  if (user.email) {
    deliver(emailService.sendPasswordResetEmail({ user, token: resetToken }));
  }

  return { user, resetToken };
};

export const resetPassword = async ({ token, newPassword }) => {
  const passwordHash = await hashPassword(newPassword);
  const user = await userRepository.resetPasswordByToken(
    hashToken(token),
    passwordHash,
  );

  if (!user) {
    throw ApiError.badRequest("Reset token is invalid or has expired");
  }

  return user;
};

export const resendVerification = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (!user.email) {
    throw ApiError.badRequest(
      "Add an email address to your profile before requesting verification",
    );
  }

  if (user.emailVerified) {
    throw ApiError.badRequest("Your email address is already verified");
  }

  await issueEmailVerification(user);
};

export const verifyEmail = async ({ token }) => {
  const user = await userRepository.verifyEmailByToken(hashToken(token));

  if (!user) {
    throw ApiError.badRequest("Verification link is invalid or has expired");
  }

  return user;
};
