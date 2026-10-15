import * as reportService from "../services/reportService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getGroupStatement = asyncHandler(async (req, res) => {
  const statement = await reportService.getGroupStatement(
    req.user,
    req.params.groupId,
  );

  return sendSuccess(res, {
    message: "Statement retrieved successfully",
    data: { statement },
  });
});

export const getMemberReliability = asyncHandler(async (req, res) => {
  const reliability = await reportService.getMemberReliability(
    req.user,
    req.params.groupId,
  );

  return sendSuccess(res, {
    message: "Member reliability retrieved successfully",
    data: { reliability },
  });
});

export const getMyStatement = asyncHandler(async (req, res) => {
  const statement = await reportService.getMyStatement(req.user);

  return sendSuccess(res, {
    message: "Statement retrieved successfully",
    data: { statement },
  });
});
