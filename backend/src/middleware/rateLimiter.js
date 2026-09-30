import rateLimit from "express-rate-limit";
import config from "../config/env.js";
import ApiError from "../utils/apiError.js";

const createLimiter = ({
  windowMs,
  max,
  message,
  skipSuccessfulRequests = false,
}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: () => config.isTest,
    handler: (req, res, next) => next(ApiError.tooManyRequests(message)),
  });

export const apiLimiter = createLimiter({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: "Too many requests, please try again later",
});

export const authLimiter = createLimiter({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.authMax,
  message: "Too many authentication attempts, please try again later",
  skipSuccessfulRequests: true,
});

export const sensitiveActionLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many attempts, please slow down",
});
