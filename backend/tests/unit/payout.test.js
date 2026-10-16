import mongoose from "mongoose";
import { describe, expect, test } from "@jest/globals";
import Payout from "../../src/models/Payout.js";

const build = (overrides = {}) =>
  new Payout({
    group: new mongoose.Types.ObjectId(),
    cycle: new mongoose.Types.ObjectId(),
    draw: new mongoose.Types.ObjectId(),
    member: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    amount: 150000,
    ...overrides,
  });

describe("payout model", () => {
  test("accepts a valid payout", () => {
    expect(build().validateSync()).toBeUndefined();
  });

  test("starts pending", () => {
    expect(build().status).toBe("pending");
  });

  test("rejects a zero amount", () => {
    expect(build({ amount: 0 }).validateSync().errors.amount).toBeDefined();
  });

  test("rejects fractional money", () => {
    expect(build({ amount: 10.5 }).validateSync().errors.amount).toBeDefined();
  });

  test("accepts manual payment methods", () => {
    expect(
      build({ paymentMethod: "bank_transfer" }).validateSync(),
    ).toBeUndefined();
  });

  test("rejects the gateway as a payout method", () => {
    expect(
      build({ paymentMethod: "chapa" }).validateSync().errors.paymentMethod,
    ).toBeDefined();
  });
});
