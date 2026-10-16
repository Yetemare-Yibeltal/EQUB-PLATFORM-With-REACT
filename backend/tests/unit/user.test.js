import { describe, expect, test } from "@jest/globals";
import User from "../../src/models/User.js";

const build = (overrides = {}) =>
  new User({
    fullName: "Abebe Kebede",
    phone: "+251911223344",
    passwordHash: "hashed-value",
    ...overrides,
  });

describe("user model", () => {
  test("accepts a valid user", () => {
    expect(build().validateSync()).toBeUndefined();
  });

  test("applies defaults", () => {
    const user = build();

    expect(user.role).toBe("user");
    expect(user.status).toBe("active");
    expect(user.isPhoneVerified).toBe(false);
    expect(user.refreshTokens).toHaveLength(0);
  });

  test("requires a normalized Ethiopian phone number", () => {
    expect(
      build({ phone: "0911223344" }).validateSync().errors.phone,
    ).toBeDefined();
    expect(
      build({ phone: "+254711223344" }).validateSync().errors.phone,
    ).toBeDefined();
  });

  test("rejects a short name", () => {
    expect(
      build({ fullName: "A" }).validateSync().errors.fullName,
    ).toBeDefined();
  });

  test("rejects an unknown role", () => {
    expect(
      build({ role: "superuser" }).validateSync().errors.role,
    ).toBeDefined();
  });

  test("lowercases and trims the email", () => {
    expect(build({ email: "  Abebe@Example.COM " }).email).toBe(
      "abebe@example.com",
    );
  });

  test("never exposes secrets in JSON", () => {
    const user = build({
      refreshTokens: [{ tokenHash: "a", expiresAt: new Date() }],
      passwordResetTokenHash: "reset",
      failedLoginAttempts: 3,
    });
    const json = user.toJSON();

    expect(json.id).toBe(String(user._id));
    expect(json._id).toBeUndefined();
    expect(json.passwordHash).toBeUndefined();
    expect(json.refreshTokens).toBeUndefined();
    expect(json.passwordResetTokenHash).toBeUndefined();
    expect(json.failedLoginAttempts).toBeUndefined();
    expect(json.fullName).toBe("Abebe Kebede");
  });
});
