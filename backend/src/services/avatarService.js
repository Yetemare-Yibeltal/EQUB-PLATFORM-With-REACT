import { STORED_FILE_KINDS } from "../constants/storedFileKinds.js";
import * as userRepository from "../repositories/userRepository.js";
import ApiError from "../utils/apiError.js";
import * as fileService from "./fileService.js";
import { getProfile } from "./userService.js";

const AVATAR_PATH = "/api/users/avatars/";

const fileIdFromUrl = (url) => {
  if (typeof url !== "string" || !url.startsWith(AVATAR_PATH)) return null;

  const id = url.slice(AVATAR_PATH.length);

  return /^[a-f0-9]{24}$/.test(id) ? id : null;
};

const replaceAvatarUrl = async (userId, avatarUrl) => {
  const user = await userRepository.updateById(userId, {
    $set: { avatarUrl },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user;
};

export const setAvatar = async (userId, file) => {
  const current = await getProfile(userId);
  const stored = await fileService.storeImage(
    userId,
    STORED_FILE_KINDS.AVATAR,
    file,
  );

  let user;

  try {
    user = await replaceAvatarUrl(userId, `${AVATAR_PATH}${stored._id}`);
  } catch (error) {
    await fileService.removeImage(stored._id, userId);
    throw error;
  }

  const previous = fileIdFromUrl(current.avatarUrl);

  if (previous) await fileService.removeImage(previous, userId);

  return user;
};

export const removeAvatar = async (userId) => {
  const current = await getProfile(userId);
  const user = await replaceAvatarUrl(userId, "");
  const previous = fileIdFromUrl(current.avatarUrl);

  if (previous) await fileService.removeImage(previous, userId);

  return user;
};

export const getAvatar = (fileId) =>
  fileService.getImage(fileId, STORED_FILE_KINDS.AVATAR);
