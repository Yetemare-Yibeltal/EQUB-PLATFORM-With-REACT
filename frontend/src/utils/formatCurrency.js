import { getCurrentLanguage } from "../i18n/currentLanguage";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CURRENCY_LABELS = {
  en: "ETB",
  am: "ብር",
};

export const formatMoney = (santim) => {
  const value = Number(santim);
  const label = CURRENCY_LABELS[getCurrentLanguage()] ?? CURRENCY_LABELS.en;

  return `${formatter.format(Number.isFinite(value) ? value / 100 : 0)} ${label}`;
};

export const toSantim = (birr) => Math.round(Number(birr) * 100);

export const toBirr = (santim) => Number(santim) / 100;
