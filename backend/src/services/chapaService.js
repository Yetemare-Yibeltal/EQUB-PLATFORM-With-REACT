import crypto from "node:crypto";
import paymentConfig from "../config/payment.js";
import ApiError from "../utils/apiError.js";
import logger from "../utils/logger.js";

const { chapa, currency } = paymentConfig;

const FAILED_PATTERN = /fail|cancel/i;

const request = async (method, path, body) => {
  if (!chapa.enabled) {
    throw ApiError.serviceUnavailable("Online payments are not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), chapa.timeoutMs);

  try {
    const response = await fetch(`${chapa.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${chapa.secretKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json = await response.json().catch(() => null);

    return { ok: response.ok, status: response.status, json };
  } catch (error) {
    logger.error(`Chapa request failed: ${error.message}`);
    throw new ApiError(502, "Payment gateway is unreachable, please try again");
  } finally {
    clearTimeout(timer);
  }
};

const splitName = (fullName) => {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0] || "Member";

  return { first, last: parts.slice(1).join(" ") || first };
};

const toLocalPhone = (phone) =>
  /^\+251[79]\d{8}$/.test(phone || "") ? `0${phone.slice(4)}` : null;

const toSantim = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
};

const normalizeState = (value) => {
  const state = String(value || "").toLowerCase();

  if (state === "success") return "success";
  if (FAILED_PATTERN.test(state)) return "failed";

  return "pending";
};

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));

  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const isConfigured = () => chapa.enabled;

export const initializeTransaction = async ({ txRef, amount, user }) => {
  const { first, last } = splitName(user.fullName);
  const phone = toLocalPhone(user.phone);

  const payload = {
    amount: (amount / 100).toFixed(2),
    currency,
    tx_ref: txRef,
    first_name: first,
    last_name: last,
    return_url: `${chapa.returnUrl}/${txRef}`,
    ...(user.email ? { email: user.email } : {}),
    ...(phone ? { phone_number: phone } : {}),
    ...(chapa.callbackUrl ? { callback_url: chapa.callbackUrl } : {}),
  };

  const { ok, json } = await request(
    "POST",
    "/transaction/initialize",
    payload,
  );
  const checkoutUrl = json?.data?.checkout_url;

  if (!ok || json?.status !== "success" || !checkoutUrl) {
    logger.warn(`Chapa rejected initialization: ${JSON.stringify(json)}`);
    throw new ApiError(
      502,
      "Payment gateway rejected the request, please try again later",
    );
  }

  return { checkoutUrl };
};

export const verifyTransaction = async (txRef) => {
  const { ok, status, json } = await request(
    "GET",
    `/transaction/verify/${encodeURIComponent(txRef)}`,
  );

  if (status >= 500) {
    throw new ApiError(502, "Payment gateway is unavailable, please try again");
  }

  const data = json?.data;

  if (!ok || !data) {
    return { state: "unknown" };
  }

  return {
    state: normalizeState(data.status),
    amount: toSantim(data.amount),
    currency: String(data.currency || "").toUpperCase(),
    reference: data.reference ? String(data.reference) : "",
    method:
      data.method || data.payment_method
        ? String(data.method || data.payment_method)
        : "",
  };
};

export const isValidWebhookSignature = (rawBody, headers) => {
  if (!chapa.webhookSecret) {
    return true;
  }

  if (!rawBody || rawBody.length === 0) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", chapa.webhookSecret)
    .update(rawBody)
    .digest("hex");
  const provided = [
    headers["x-chapa-signature"],
    headers["chapa-signature"],
  ].filter(Boolean);

  return provided.some((signature) => safeEqual(signature, expected));
};
