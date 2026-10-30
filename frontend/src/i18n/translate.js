import am from "./locales/am";
import en from "./locales/en";

const DICTIONARIES = { en, am };

export function translate(language, key, params) {
  const template = DICTIONARIES[language]?.[key] ?? DICTIONARIES.en[key] ?? key;

  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, name) =>
    params[name] === undefined ? match : String(params[name]),
  );
}
