import * as payoutService from "../services/payoutService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listGroupPayouts = asyncHandler(async (req, res) => {
  const { items, meta } = await payoutService.listGroupPayouts(
    req.user,
    req.params.groupId,
    req.query,
  );

  return sendSuccess(res, {
    message: "Payouts retrieved successfully",
    data: { payouts: items },
    meta,
  });
});

export const listMyPayouts = asyncHandler(async (req, res) => {
  const { items, meta } = await payoutService.listMyPayouts(
    req.user,
    req.query,
  );

  return sendSuccess(res, {
    message: "Your payouts retrieved successfully",
    data: { payouts: items },
    meta,
  });
});

export const getPayout = asyncHandler(async (req, res) => {
  const payout = await payoutService.getPayout(
    req.user,
    req.params.groupId,
    req.params.payoutId,
  );

  return sendSuccess(res, {
    message: "Payout retrieved successfully",
    data: { payout },
  });
});

export const recordPayout = asyncHandler(async (req, res) => {
  const result = await payoutService.recordPayout(
    req.user,
    req.params.groupId,
    req.params.payoutId,
    req.body,
  );

  return sendSuccess(res, {
    message: "Payout recorded successfully",
    data: result,
  });
});
