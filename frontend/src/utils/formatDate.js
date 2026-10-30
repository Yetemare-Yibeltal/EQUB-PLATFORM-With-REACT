import { getCurrentLanguage } from "../i18n/currentLanguage";
import { translate } from "../i18n/translate";

const TIME_ZONE = "Africa/Addis_Ababa";

const DATE_LOCALES = {
  en: "en-GB",
  am: "am-ET-u-ca-ethiopic",
};

const RELATIVE_LOCALES = {
  en: "en",
  am: "am",
};

const UNITS = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

const cache = new Map();

const cached = (key, create) => {
  if (!cache.has(key)) {
    try {
      cache.set(key, create());
    } catch {
      cache.set(key, null);
    }
  }

  return cache.get(key);
};

const dateFormatter = (language) =>
  cached(
    `date:${language}`,
    () =>
      new Intl.DateTimeFormat(DATE_LOCALES[language] ?? DATE_LOCALES.en, {
        dateStyle: "medium",
        timeZone: TIME_ZONE,
      }),
  ) ?? dateFormatter("en");

const dateTimeFormatter = (language) =>
  cached(
    `datetime:${language}`,
    () =>
      new Intl.DateTimeFormat(DATE_LOCALES[language] ?? DATE_LOCALES.en, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: TIME_ZONE,
      }),
  ) ?? dateTimeFormatter("en");

const relativeFormatter = (language) =>
  cached(
    `relative:${language}`,
    () =>
      new Intl.RelativeTimeFormat(
        RELATIVE_LOCALES[language] ?? RELATIVE_LOCALES.en,
        { numeric: "auto" },
      ),
  ) ?? relativeFormatter("en");

const toDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value) => {
  const date = toDate(value);

  return date ? dateFormatter(getCurrentLanguage()).format(date) : "—";
};

export const formatDateTime = (value) => {
  const date = toDate(value);

  return date ? dateTimeFormatter(getCurrentLanguage()).format(date) : "—";
};

export const formatRelative = (value, now = Date.now()) => {
  const date = toDate(value);

  if (!date) return "—";

  const language = getCurrentLanguage();
  const seconds = Math.round((date.getTime() - now) / 1000);

  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter(language).format(
        Math.round(seconds / size),
        unit,
      );
    }
  }

  return translate(language, "just now");
};
