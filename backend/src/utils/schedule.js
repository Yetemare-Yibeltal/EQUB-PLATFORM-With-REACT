import { CONTRIBUTION_FREQUENCIES } from "../constants/contributionFrequencies.js";

export const DAY_MS = 24 * 60 * 60 * 1000;

export const toUtcDate = (value) => {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const addDays = (base, days) => new Date(base.getTime() + days * DAY_MS);

const addMonths = (base, months) => {
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth() + months;
  const day = base.getUTCDate();
  const lastDayOfTargetMonth = new Date(
    Date.UTC(year, month + 1, 0),
  ).getUTCDate();

  return new Date(Date.UTC(year, month, Math.min(day, lastDayOfTargetMonth)));
};

const STEP_BY_FREQUENCY = {
  [CONTRIBUTION_FREQUENCIES.WEEKLY]: (base, index) => addDays(base, index * 7),
  [CONTRIBUTION_FREQUENCIES.BIWEEKLY]: (base, index) =>
    addDays(base, index * 14),
  [CONTRIBUTION_FREQUENCIES.MONTHLY]: (base, index) => addMonths(base, index),
};

export const buildCycleDates = (startDate, frequency, count) => {
  const step = STEP_BY_FREQUENCY[frequency];

  if (!step) {
    throw new Error(`Unsupported contribution frequency: ${frequency}`);
  }

  const base = toUtcDate(startDate);

  return Array.from({ length: count }, (_, index) => step(base, index));
};

export const lateThreshold = (dueDate, gracePeriodDays = 0) =>
  addDays(new Date(dueDate), gracePeriodDays + 1);
