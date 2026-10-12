import * as userService from "../services/userService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);

  return sendSuccess(res, {
    message: "Profile retrieved successfully",
    data: { user },
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);

  return sendSuccess(res, {
    message: "Profile updated successfully",
    data: { user },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await userService.listUsers(req.query);

  return sendSuccess(res, {
    message: "Users retrieved successfully",
    data: { users: items },
    meta,
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);

  return sendSuccess(res, {
    message: "User retrieved successfully",
    data: { user },
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateUserStatus(
    req.user.id,
    req.params.userId,
    req.body.status,
  );

  return sendSuccess(res, {
    message: "User status updated successfully",
    data: { user },
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(
    req.user.id,
    req.params.userId,
    req.body.role,
  );

  return sendSuccess(res, {
    message: "User role updated successfully",
    data: { user },
  });
});
