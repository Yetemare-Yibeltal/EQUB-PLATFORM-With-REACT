import config from "../config/env.js";
import * as authService from "../services/authService.js";
import { sendCreated, sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const REFRESH_COOKIE_NAME = "refreshToken";

const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? "strict" : "lax",
  path: "/api/auth",
};

const setRefreshCookie = (res, token, expiresAt) =>
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...cookieOptions,
    expires: expiresAt,
  });

const clearRefreshCookie = (res) =>
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);

const getRequestMeta = (req) => ({
  userAgent: req.get("user-agent") || "",
  ip: req.ip || "",
});

const readRefreshToken = (req) =>
  req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } =
    await authService.register(req.body, getRequestMeta(req));

  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);

  return sendCreated(res, {
    message: "Account created successfully",
    data: { user, accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } =
    await authService.login(req.body, getRequestMeta(req));

  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);

  return sendSuccess(res, {
    message: "Logged in successfully",
    data: { user, accessToken },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const { user, accessToken, refreshToken, refreshTokenExpiresAt } =
      await authService.refresh(readRefreshToken(req), getRequestMeta(req));

    setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);

    return sendSuccess(res, {
      message: "Session refreshed successfully",
      data: { user, accessToken },
    });
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(readRefreshToken(req));
  clearRefreshCookie(res);

  return sendSuccess(res, { message: "Logged out successfully" });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearRefreshCookie(res);

  return sendSuccess(res, { message: "Logged out from all devices" });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } =
    await authService.changePassword(
      req.user.id,
      req.body,
      getRequestMeta(req),
    );

  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);

  return sendSuccess(res, {
    message: "Password changed successfully",
    data: { user, accessToken },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.identifier);

  const data =
    !config.isProduction && result
      ? { resetToken: result.resetToken }
      : undefined;

  return sendSuccess(res, {
    message:
      "If an account exists for the provided identifier, a password reset code has been issued",
    data,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  clearRefreshCookie(res);

  return sendSuccess(res, { message: "Password has been reset successfully" });
});
