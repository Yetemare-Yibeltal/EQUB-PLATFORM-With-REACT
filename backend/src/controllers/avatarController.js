import * as avatarService from "../services/avatarService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await avatarService.setAvatar(req.user.id, req.file);

  return sendSuccess(res, {
    message: "Profile photo updated successfully",
    data: { user },
  });
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await avatarService.removeAvatar(req.user.id);

  return sendSuccess(res, {
    message: "Profile photo removed successfully",
    data: { user },
  });
});

export const getAvatar = asyncHandler(async (req, res) => {
  const image = await avatarService.getAvatar(req.params.fileId);

  res.set({
    "Content-Type": image.contentType,
    "Content-Length": String(image.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });

  return res.status(200).end(image.data);
});
