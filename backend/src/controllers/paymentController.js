import * as chapaService from "../services/chapaService.js";
import * as paymentService from "../services/paymentService.js";
import ApiError from "../utils/apiError.js";
import { sendCreated, sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const TX_REF_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const extractTxRef = (source) =>
  [source?.tx_ref, source?.trx_ref].find(
    (value) => typeof value === "string" && TX_REF_PATTERN.test(value),
  ) ?? null;

export const createCheckout = asyncHandler(async (req, res) => {
  const payment = await paymentService.initiateCheckout(req.user, req.body);

  return sendCreated(res, {
    message: "Checkout created successfully",
    data: { payment },
  });
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPayment(req.user, req.params.txRef);

  return sendSuccess(res, {
    message: "Payment retrieved successfully",
    data: { payment },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.verifyPayment(
    req.user,
    req.params.txRef,
  );

  return sendSuccess(res, {
    message: "Payment status refreshed",
    data: { payment },
  });
});

export const listMyPayments = asyncHandler(async (req, res) => {
  const { items, meta } = await paymentService.listMyPayments(
    req.user,
    req.query,
  );

  return sendSuccess(res, {
    message: "Payments retrieved successfully",
    data: { payments: items },
    meta,
  });
});

export const listPayments = asyncHandler(async (req, res) => {
  const { items, meta } = await paymentService.listPayments(req.query);

  return sendSuccess(res, {
    message: "Payments retrieved successfully",
    data: { payments: items },
    meta,
  });
});

export const handleWebhook = asyncHandler(async (req, res) => {
  if (!chapaService.isValidWebhookSignature(req.rawBody, req.headers)) {
    throw ApiError.unauthorized("Invalid webhook signature");
  }

  await paymentService.processGatewayNotification(extractTxRef(req.body));

  return sendSuccess(res, { message: "Notification processed" });
});

export const handleCallback = asyncHandler(async (req, res) => {
  await paymentService.processGatewayNotification(extractTxRef(req.query));

  return sendSuccess(res, { message: "Notification processed" });
});
