import { describe, expect, test } from "@jest/globals";
import {
  buildPaginationMeta,
  parsePagination,
  parseSort,
} from "../../src/utils/pagination.js";

describe("parsePagination", () => {
  test("applies defaults", () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  test("parses string values", () => {
    expect(parsePagination({ page: "3", limit: "20" })).toEqual({
      page: 3,
      limit: 20,
      skip: 40,
    });
  });

  test("caps the limit", () => {
    expect(parsePagination({ limit: "500" }).limit).toBe(100);
    expect(parsePagination({ limit: "500" }, { maxLimit: 50 }).limit).toBe(50);
  });

  test("falls back for invalid values", () => {
    expect(parsePagination({ page: "abc", limit: "-4" })).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
    expect(parsePagination({ page: "0" }).page).toBe(1);
  });

  test("honors a custom default limit", () => {
    expect(parsePagination({}, { defaultLimit: 50 }).limit).toBe(50);
  });
});

describe("buildPaginationMeta", () => {
  test("describes a middle page", () => {
    expect(buildPaginationMeta({ total: 25, page: 2, limit: 10 })).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  test("describes the last page", () => {
    const meta = buildPaginationMeta({ total: 25, page: 3, limit: 10 });

    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(true);
  });

  test("reports one page when empty", () => {
    const meta = buildPaginationMeta({ total: 0, page: 1, limit: 10 });

    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });
});

describe("parseSort", () => {
  const allowed = ["createdAt", "name"];

  test("parses ascending and descending fields", () => {
    expect(parseSort("-createdAt,name", allowed)).toEqual({
      createdAt: -1,
      name: 1,
    });
  });

  test("ignores fields that are not allowed", () => {
    expect(parseSort("passwordHash,name", allowed)).toEqual({ name: 1 });
  });

  test("falls back when nothing is allowed", () => {
    expect(parseSort("passwordHash", allowed)).toEqual({ createdAt: -1 });
  });

  test("uses the fallback when no sort is given", () => {
    expect(parseSort(undefined, allowed, "name")).toEqual({ name: 1 });
    expect(parseSort("", allowed)).toEqual({ createdAt: -1 });
  });
});
