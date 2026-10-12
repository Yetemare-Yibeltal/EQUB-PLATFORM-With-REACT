import { USER_STATUSES } from "../constants/userStatuses.js";
import * as userRepository from "../repositories/userRepository.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/generateToken.js";

const extractBearerToken = (req) => {
  const header = req.headers.authorization;

  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return null;
};

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    throw ApiError.unauthorized("Authentication token is missing");
  }

  const payload = verifyAccessToken(token);

  const user = await userRepository.findById(payload.sub, {
    select: "fullName phone email role status passwordChangedAt",
    lean: true,
  });

  if (!user) {
    throw ApiError.unauthorized("The account for this token no longer exists");
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw ApiError.forbidden(
      "Your account has been suspended, please contact support",
    );
  }

  if (user.passwordChangedAt) {
    const changedAtSeconds = Math.floor(
      user.passwordChangedAt.getTime() / 1000,
    );
    if (changedAtSeconds > payload.iat) {
      throw ApiError.unauthorized(
        "Password was changed recently, please log in again",
      );
    }
  }

  req.user = {
    id: String(user._id),
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  return next();
});

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }

    return next();
  };
