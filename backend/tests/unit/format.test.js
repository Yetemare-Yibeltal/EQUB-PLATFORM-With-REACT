import { describe, expect, test } from "@jest/globals";
import {
  clip,
  formatDate,
  formatMoney,
  humanize,
} from "../../src/utils/format.js";

describe("message formatting", () => {
  test("formats santim as ETB", () => {
    expect(formatMoney(123456)).toBe("1,234.56 ETB");
    expect(formatMoney(50000)).toBe("500.00 ETB");
    expect(formatMoney(0)).toBe("0.00 ETB");
  });

  test("formats dates as ISO days", () => {
    expect(formatDate("2026-03-10T15:30:00Z")).toBe("2026-03-10");
  });

  test("clips long text with an ellipsis", () => {
    expect(clip("abcdef", 4)).toBe("abc…");
    expect(clip("abc", 4)).toBe("abc");
    expect(clip(null, 4)).toBe("");
  });

  test("humanizes identifiers", () => {
    expect(humanize("bank_transfer")).toBe("bank transfer");
    expect(humanize(undefined)).toBe("");
  });
});
