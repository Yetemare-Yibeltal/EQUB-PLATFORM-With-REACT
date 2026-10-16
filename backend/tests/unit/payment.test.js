import crypto from "node:crypto";
import { describe, expect, test } from "@jest/globals";
import {
  isConfigured,
  isValidWebhookSignature,
} from "../../src/services/chapaService.js";

const secret = "whsec_test";
const body = Buffer.from(
  JSON.stringify({ tx_ref: "eqb-abc", status: "success" }),
);
const sign = (payload, key = secret) =>
  crypto.createHmac("sha256", key).update(payload).digest("hex");

describe("Chapa webhook signature", () => {
  test("reports the gateway as configured", () => {
    expect(isConfigured()).toBe(true);
  });

  test("accepts a valid x-chapa-signature header", () => {
    expect(
      isValidWebhookSignature(body, { "x-chapa-signature": sign(body) }),
    ).toBe(true);
  });

  test("accepts a valid chapa-signature header", () => {
    expect(
      isValidWebhookSignature(body, { "chapa-signature": sign(body) }),
    ).toBe(true);
  });

  test("rejects a signature made with another secret", () => {
    expect(
      isValidWebhookSignature(body, {
        "x-chapa-signature": sign(body, "other"),
      }),
    ).toBe(false);
  });

  test("rejects a signature for a different body", () => {
    const other = Buffer.from('{"tx_ref":"eqb-other"}');

    expect(
      isValidWebhookSignature(body, { "x-chapa-signature": sign(other) }),
    ).toBe(false);
  });

  test("rejects a missing signature", () => {
    expect(isValidWebhookSignature(body, {})).toBe(false);
  });

  test("rejects a signature of the wrong length", () => {
    expect(isValidWebhookSignature(body, { "x-chapa-signature": "abc" })).toBe(
      false,
    );
  });

  test("rejects an empty body", () => {
    expect(
      isValidWebhookSignature(Buffer.alloc(0), {
        "x-chapa-signature": sign(body),
      }),
    ).toBe(false);
    expect(
      isValidWebhookSignature(undefined, { "x-chapa-signature": sign(body) }),
    ).toBe(false);
  });
});
