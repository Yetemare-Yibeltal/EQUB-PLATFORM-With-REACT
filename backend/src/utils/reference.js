export const normalizeReference = (value) =>
  String(value ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
