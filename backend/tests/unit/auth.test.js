import { describe, expect, test } from "@jest/globals";
import {
  generateRandomToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/generateToken.js";
import { comparePassword, hashPassword } from "../../src/utils/password.js";
import { isValidPhone, normalizePhone } from "../../src/utils/phone.js";

describe("phone normalization", () => {
  test.each([
    ["0911223344", "+251911223344"],
    ["+251911223344", "+251911223344"],
    ["251911223344", "+251911223344"],
    ["00251911223344", "+251911223344"],
    ["0911 22 33 44", "+251911223344"],
    ["0711223344", "+251711223344"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  test.each([
    "0811223344",
    "091122334",
    "09112233445",
    "abc",
    "a@b.com",
    "",
    null,
    undefined,
    911223344,
  ])("rejects %p", (input) => {
    expect(normalizePhone(input)).toBeNull();
    expect(isValidPhone(input)).toBe(false);
  });
});

describe("password hashing", () => {
  test("hashes and verifies a password", async () => {
    const hash = await hashPassword("Secret123");

    expect(hash).not.toBe("Secret123");
    expect(await comparePassword("Secret123", hash)).toBe(true);
    expect(await comparePassword("Wrong123", hash)).toBe(false);
  });

  test("produces a different hash each time", async () => {
    expect(await hashPassword("Secret123")).not.toBe(
      await hashPassword("Secret123"),
    );
  });
});

describe("tokens", () => {
  const user = { _id: "507f1f77bcf86cd799439011", role: "user" };

  test("signs and verifies an access token", () => {
    const payload = verifyAccessToken(signAccessToken(user));

    expect(payload.sub).toBe(user._id);
    expect(payload.role).toBe("user");
  });

  test("signs a refresh token with a future expiry", () => {
    const { token, expiresAt } = signRefreshToken(user);

    expect(verifyRefreshToken(token).sub).toBe(user._id);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  test("issues a unique refresh token each time", () => {
    expect(signRefreshToken(user).token).not.toBe(signRefreshToken(user).token);
  });

  test("keeps access and refresh secrets separate", () => {
    expect(() => verifyRefreshToken(signAccessToken(user))).toThrow();
    expect(() => verifyAccessToken(signRefreshToken(user).token)).toThrow();
  });

  test("rejects a tampered token", () => {
    expect(() => verifyAccessToken(`${signAccessToken(user)}x`)).toThrow();
  });

  test("hashes tokens deterministically", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
    expect(hashToken("abc")).toMatch(/^[a-f0-9]{64}$/);
  });

  test("generates random tokens", () => {
    const token = generateRandomToken(32);

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(generateRandomToken(32)).not.toBe(token);
  });
});
