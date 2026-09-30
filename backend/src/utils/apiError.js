class ApiError extends Error {
  constructor(statusCode, message, details = null, isOperational = true) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Authentication required", details = null) {
    return new ApiError(401, message, details);
  }

  static forbidden(
    message = "You do not have permission to perform this action",
    details = null,
  ) {
    return new ApiError(403, message, details);
  }

  static notFound(message = "Resource not found", details = null) {
    return new ApiError(404, message, details);
  }

  static conflict(message = "Resource conflict", details = null) {
    return new ApiError(409, message, details);
  }

  static unprocessable(message = "Unprocessable request", details = null) {
    return new ApiError(422, message, details);
  }

  static tooManyRequests(
    message = "Too many requests, please try again later",
    details = null,
  ) {
    return new ApiError(429, message, details);
  }

  static internal(message = "Internal server error", details = null) {
    return new ApiError(500, message, details, false);
  }

  static serviceUnavailable(
    message = "Service temporarily unavailable",
    details = null,
  ) {
    return new ApiError(503, message, details);
  }
}

export default ApiError;
