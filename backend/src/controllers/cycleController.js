import * as cycleService from "../services/cycleService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const startGroup = asyncHandler(async (req, res) => {
  const result = await cycleService.startGroup(req.user, req.params.groupId);

  return sendSuccess(res, {
    message: "Group started successfully",
    data: result,
  });
});

export const listCycles = asyncHandler(async (req, res) => {
  const cycles = await cycleService.listCycles(req.user, req.params.groupId);

  return sendSuccess(res, {
    message: "Cycles retrieved successfully",
    data: { cycles },
  });
});

export const getCurrentCycle = asyncHandler(async (req, res) => {
  const cycle = await cycleService.getCurrentCycle(
    req.user,
    req.params.groupId,
  );

  return sendSuccess(res, {
    message: "Current cycle retrieved successfully",
    data: { cycle },
  });
});

export const getCycle = asyncHandler(async (req, res) => {
  const cycle = await cycleService.getCycle(
    req.user,
    req.params.groupId,
    req.params.cycleId,
  );

  return sendSuccess(res, {
    message: "Cycle retrieved successfully",
    data: { cycle },
  });
});
