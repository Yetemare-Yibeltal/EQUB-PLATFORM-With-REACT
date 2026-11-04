import * as storedFileRepository from "../repositories/storedFileRepository.js";
import ApiError from "../utils/apiError.js";
import { detectImageType } from "../utils/imageType.js";
import logger from "../utils/logger.js";

export const storeImage = async (ownerId, kind, file) => {
  if (!file?.buffer?.length) {
    throw ApiError.badRequest("Choose an image to upload");
  }

  const contentType = detectImageType(file.buffer);

  if (!contentType) {
    throw ApiError.badRequest("Only JPEG, PNG or WebP images are allowed");
  }

  return storedFileRepository.create({
    owner: ownerId,
    kind,
    contentType,
    size: file.buffer.length,
    data: file.buffer,
  });
};

export const getImage = async (fileId, kind) => {
  const file = await storedFileRepository.findWithData(fileId);

  if (!file || file.kind !== kind) {
    throw ApiError.notFound("Image not found");
  }

  return {
    contentType: file.contentType,
    size: file.size,
    data: Buffer.from(file.data),
  };
};

export const removeImage = async (fileId, ownerId) => {
  try {
    await storedFileRepository.deleteOwned(fileId, ownerId);
  } catch (error) {
    logger.warn(`Stored image cleanup failed: ${error.message}`);
  }
};
