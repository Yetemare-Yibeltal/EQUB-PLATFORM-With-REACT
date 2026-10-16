import { describe, expect, test } from "@jest/globals";
import {
  buildCycleDates,
  lateThreshold,
  toUtcDate,
} from "../../src/utils/schedule.js";

const days = (dates) => dates.map((date) => date.toISOString().slice(0, 10));

describe("cycle schedule", () => {
  test("builds weekly dates", () => {
    expect(days(buildCycleDates("2026-01-05", "weekly", 3))).toEqual([
      "2026-01-05",
      "2026-01-12",
      "2026-01-19",
    ]);
  });

  test("builds biweekly dates", () => {
    expect(days(buildCycleDates("2026-01-05", "biweekly", 3))).toEqual([
      "2026-01-05",
      "2026-01-19",
      "2026-02-02",
    ]);
  });

  test("builds monthly dates", () => {
    expect(days(buildCycleDates("2026-03-10", "monthly", 3))).toEqual([
      "2026-03-10",
      "2026-04-10",
      "2026-05-10",
    ]);
  });

  test("clamps month-end dates without drifting", () => {
    expect(days(buildCycleDates("2026-01-31", "monthly", 4))).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  test("rolls over the year boundary", () => {
    expect(days(buildCycleDates("2026-11-15", "monthly", 3))).toEqual([
      "2026-11-15",
      "2026-12-15",
      "2027-01-15",
    ]);
  });

  test("returns an empty schedule for a zero count", () => {
    expect(buildCycleDates("2026-01-05", "weekly", 0)).toEqual([]);
  });

  test("rejects an unsupported frequency", () => {
    expect(() => buildCycleDates("2026-01-05", "daily", 2)).toThrow(
      "Unsupported",
    );
  });

  test("strips the time of day", () => {
    expect(toUtcDate("2026-03-10T15:30:00Z").toISOString()).toBe(
      "2026-03-10T00:00:00.000Z",
    );
  });

  test("adds the grace period plus one day to the late threshold", () => {
    const due = new Date("2026-03-10T00:00:00Z");

    expect(lateThreshold(due, 2).toISOString()).toBe(
      "2026-03-13T00:00:00.000Z",
    );
    expect(lateThreshold(due, 0).toISOString()).toBe(
      "2026-03-11T00:00:00.000Z",
    );
    expect(lateThreshold(due).toISOString()).toBe("2026-03-11T00:00:00.000Z");
  });
});
