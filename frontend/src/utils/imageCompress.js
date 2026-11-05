const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 2.5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ACCEPTED_TYPES.join(",");

const fromBitmap = (file) =>
  typeof createImageBitmap === "function"
    ? createImageBitmap(file, { imageOrientation: "from-image" }).catch(
        () => null,
      )
    : Promise.resolve(null);

const fromImageElement = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be read"));
    };
    image.src = url;
  });

const loadSource = async (file) =>
  (await fromBitmap(file)) ?? fromImageElement(file);

const toJpeg = (canvas, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

export const prepareImage = async (file, { maxSide = 1280 } = {}) => {
  if (!file || !ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Choose a JPEG, PNG or WebP image");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("This image is too large. Choose one under 15 MB");
  }

  const source = await loadSource(file);
  const width = source.naturalWidth ?? source.width;
  const height = source.naturalHeight ?? source.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  if (typeof source.close === "function") source.close();

  let quality = 0.85;
  let blob = await toJpeg(canvas, quality);

  while (blob && blob.size > MAX_UPLOAD_BYTES && quality > 0.4) {
    quality -= 0.1;
    blob = await toJpeg(canvas, quality);
  }

  if (!blob || blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("This image is too large. Choose a smaller one");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
};
