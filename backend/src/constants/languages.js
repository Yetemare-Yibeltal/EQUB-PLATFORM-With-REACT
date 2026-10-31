export const LANGUAGES = Object.freeze({
  EN: "en",
  AM: "am",
});

export const LANGUAGE_VALUES = Object.freeze(Object.values(LANGUAGES));

export const DEFAULT_LANGUAGE = LANGUAGES.EN;

export const resolveLanguage = (value) =>
  LANGUAGE_VALUES.includes(value) ? value : DEFAULT_LANGUAGE;
