import * as groupService from "../services/groupService.js";
import { sendCreated, sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createGroup = asyncHandler(async (req, res) => {
  const group = await groupService.createGroup(req.user, req.body);

  return sendCreated(res, {
    message: "Group created successfully",
    data: { group },
  });
});

export const listGroups = asyncHandler(async (req, res) => {
  const { items, meta } = await groupService.listMyGroups(req.user, req.query);

  return sendSuccess(res, {
    message: "Groups retrieved successfully",
    data: { groups: items },
    meta,
  });
});

export const previewGroup = asyncHandler(async (req, res) => {
  const group = await groupService.previewGroup(req.params.inviteCode);

  return sendSuccess(res, {
    message: "Group preview retrieved successfully",
    data: { group },
  });
});

export const getGroup = asyncHandler(async (req, res) => {
  const group = await groupService.getGroup(req.user, req.params.groupId);

  return sendSuccess(res, {
    message: "Group retrieved successfully",
    data: { group },
  });
});

export const updateGroup = asyncHandler(async (req, res) => {
  const group = await groupService.updateGroup(
    req.user,
    req.params.groupId,
    req.body,
  );

  return sendSuccess(res, {
    message: "Group updated successfully",
    data: { group },
  });
});

export const cancelGroup = asyncHandler(async (req, res) => {
  const group = await groupService.cancelGroup(
    req.user,
    req.params.groupId,
    req.body.reason,
  );

  return sendSuccess(res, {
    message: "Group cancelled successfully",
    data: { group },
  });
});

export const regenerateInviteCode = asyncHandler(async (req, res) => {
  const result = await groupService.regenerateInviteCode(
    req.user,
    req.params.groupId,
  );

  return sendSuccess(res, {
    message: "Invite code regenerated successfully",
    data: result,
  });
});
