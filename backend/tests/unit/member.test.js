import mongoose from "mongoose";
import { describe, expect, test } from "@jest/globals";
import Member from "../../src/models/Member.js";

const build = (overrides = {}) =>
  new Member({
    group: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    ...overrides,
  });

describe("member model", () => {
  test("accepts a valid member", () => {
    expect(build().validateSync()).toBeUndefined();
  });

  test("applies defaults", () => {
    const member = build();

    expect(member.role).toBe("member");
    expect(member.status).toBe("pending");
    expect(member.hasReceivedPayout).toBe(false);
    expect(member.payoutPosition).toBeNull();
  });

  test("rejects an unknown status", () => {
    expect(
      build({ status: "banned" }).validateSync().errors.status,
    ).toBeDefined();
  });

  test("rejects an unknown role", () => {
    expect(build({ role: "owner" }).validateSync().errors.role).toBeDefined();
  });

  test("rejects a payout position below one", () => {
    expect(
      build({ payoutPosition: 0 }).validateSync().errors.payoutPosition,
    ).toBeDefined();
  });

  test("requires a group and a user", () => {
    const errors = new Member({}).validateSync().errors;

    expect(errors.group).toBeDefined();
    expect(errors.user).toBeDefined();
  });
});
