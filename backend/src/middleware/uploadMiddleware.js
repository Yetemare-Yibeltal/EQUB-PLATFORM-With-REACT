import multer from "multer";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 1,
    fields: 10,
    fieldSize: 10 * 1024,
  },
});

export const uploadImage = (fieldName) => upload.single(fieldName);
