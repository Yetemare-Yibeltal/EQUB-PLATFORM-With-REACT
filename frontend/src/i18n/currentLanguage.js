import { DEFAULT_LANGUAGE } from "./languages";

let current = DEFAULT_LANGUAGE;

export const getCurrentLanguage = () => current;

export const setCurrentLanguage = (language) => {
  current = language;
};
