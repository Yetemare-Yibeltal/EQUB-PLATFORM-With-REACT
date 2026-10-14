import * as contributionService from "../services/contributionService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listContributions = asyncHandler(async (req, res) => {
  const { items, meta } = await contributionService.listContributions(
    req.user,
    req.params.groupId,
    req.query,
  );

  return sendSuccess(res, {
    message: "Contributions retrieved successfully",
    data: { contributions: items },
    meta,
  });
});

export const listMyContributions = asyncHandler(async (req, res) => {
  const { items, meta } = await contributionService.listMyContributions(
    req.user,
    req.query,
  );

  return sendSuccess(res, {
    message: "Your contributions retrieved successfully",
    data: { contributions: items },
    meta,
  });
});

export const recordContribution = asyncHandler(async (req, res) => {
  const contribution = await contributionService.recordContribution(
    req.user,
    req.params.groupId,
    req.params.contributionId,
    req.body,
  );

  return sendSuccess(res, {
    message: "Contribution recorded successfully",
    data: { contribution },
  });
});

export const waiveContribution = asyncHandler(async (req, res) => {
  const contribution = await contributionService.waiveContribution(
    req.user,
    req.params.groupId,
    req.params.contributionId,
    req.body.reason,
  );

  return sendSuccess(res, {
    message: "Contribution waived successfully",
    data: { contribution },
  });
});
