import mongoose from "mongoose";
import config from "../config/env.js";
import ApiError from "../utils/apiError.js";
import logger from "../utils/logger.js";

const normalizeError = (error) => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return ApiError.badRequest("Validation failed", details);
  }

  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${error.path}`);
  }

  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    const label = fields.length ? fields.join(", ") : "field";
    return ApiError.conflict(
      `Duplicate value for ${label}`,
      fields.map((field) => ({ field })),
    );
  }

  if (error.name === "TokenExpiredError") {
    return ApiError.unauthorized("Token has expired");
  }

  if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
    return ApiError.unauthorized("Invalid token");
  }

  if (error.type === "entity.parse.failed") {
    return ApiError.badRequest("Malformed JSON in request body");
  }

  if (error.type === "entity.too.large") {
    return new ApiError(413, "Request body is too large");
  }

  if (error.name === "MulterError") {
    return ApiError.badRequest(error.message);
  }

  return new ApiError(
    error.statusCode || 500,
    error.message || "Internal server error",
    null,
    false,
  );
};

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const normalized = normalizeError(error);
  const { statusCode } = normalized;

  if (statusCode >= 500) {
    logger.error(
      `${req.method} ${req.originalUrl} -> ${statusCode}: ${error.message}`,
      {
        stack: error.stack,
      },
    );
  } else {
    logger.warn(
      `${req.method} ${req.originalUrl} -> ${statusCode}: ${normalized.message}`,
    );
  }

  const exposeMessage = normalized.isOperational || !config.isProduction;

  const payload = {
    success: false,
    message: exposeMessage ? normalized.message : "Internal server error",
  };

  if (normalized.details && exposeMessage) {
    payload.errors = normalized.details;
  }

  if (!config.isProduction && statusCode >= 500) {
    payload.stack = error.stack;
  }

  return res.status(statusCode).json(payload);
};

export default errorHandler;
