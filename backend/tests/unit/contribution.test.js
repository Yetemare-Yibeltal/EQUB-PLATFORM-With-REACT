import mongoose from "mongoose";
import { describe, expect, test } from "@jest/globals";
import Contribution from "../../src/models/Contribution.js";

const build = (overrides = {}) =>
  new Contribution({
    group: new mongoose.Types.ObjectId(),
    cycle: new mongoose.Types.ObjectId(),
    member: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    amount: 50000,
    latePenaltyAmount: 5000,
    dueDate: new Date(Date.now() - 5 * 86400000),
    lateAfter: new Date(Date.now() + 86400000),
    ...overrides,
  });

describe("contribution model", () => {
  test("accepts a valid contribution", () => {
    expect(build().validateSync()).toBeUndefined();
  });

  test("defaults to pending and not late", () => {
    const contribution = build();

    expect(contribution.status).toBe("pending");
    expect(contribution.isLate).toBe(false);
    expect(contribution.amountPaid).toBe(0);
  });

  test("rejects an invalid payment method", () => {
    expect(
      build({ paymentMethod: "barter" }).validateSync().errors.paymentMethod,
    ).toBeDefined();
  });

  test("rejects a non-positive amount", () => {
    expect(build({ amount: 0 }).validateSync().errors.amount).toBeDefined();
  });

  test("is not overdue before the late threshold", () => {
    const contribution = build();

    expect(contribution.isOverdue).toBe(false);
    expect(contribution.amountOutstanding).toBe(50000);
  });

  test("is overdue after the late threshold and includes the penalty", () => {
    const contribution = build({ lateAfter: new Date(Date.now() - 1000) });

    expect(contribution.isOverdue).toBe(true);
    expect(contribution.amountOutstanding).toBe(55000);
  });

  test("owes nothing once paid", () => {
    const contribution = build({
      status: "paid",
      lateAfter: new Date(Date.now() - 1000),
    });

    expect(contribution.isOverdue).toBe(false);
    expect(contribution.amountOutstanding).toBe(0);
  });

  test("owes nothing once waived", () => {
    expect(build({ status: "waived" }).amountOutstanding).toBe(0);
  });
});
