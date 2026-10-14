import * as transactionService from "../services/transactionService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listGroupTransactions = asyncHandler(async (req, res) => {
  const { items, meta } = await transactionService.listGroupTransactions(
    req.user,
    req.params.groupId,
    req.query,
  );

  return sendSuccess(res, {
    message: "Transactions retrieved successfully",
    data: { transactions: items },
    meta,
  });
});

export const getGroupSummary = asyncHandler(async (req, res) => {
  const summary = await transactionService.getGroupSummary(
    req.user,
    req.params.groupId,
  );

  return sendSuccess(res, {
    message: "Summary retrieved successfully",
    data: { summary },
  });
});

export const listMyTransactions = asyncHandler(async (req, res) => {
  const { items, meta } = await transactionService.listMyTransactions(
    req.user,
    req.query,
  );

  return sendSuccess(res, {
    message: "Your transactions retrieved successfully",
    data: { transactions: items },
    meta,
  });
});
