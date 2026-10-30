export const STORAGE_KEY = "kmem.language";

export const DEFAULT_LANGUAGE = "en";

export const LANGUAGE_OPTIONS = Object.freeze([
  { code: "en", label: "English", short: "EN" },
  { code: "am", label: "አማርኛ", short: "አማ" },
]);

export const LANGUAGE_CODES = Object.freeze(
  LANGUAGE_OPTIONS.map((option) => option.code),
);
