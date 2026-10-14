import * as drawService from "../services/drawService.js";
import { sendCreated, sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const performDraw = asyncHandler(async (req, res) => {
  const result = await drawService.performDraw(
    req.user,
    req.params.groupId,
    req.body.cycleId,
  );

  return sendCreated(res, {
    message: "Draw completed successfully",
    data: result,
  });
});

export const listDraws = asyncHandler(async (req, res) => {
  const { items, meta } = await drawService.listDraws(
    req.user,
    req.params.groupId,
    req.query,
  );

  return sendSuccess(res, {
    message: "Draws retrieved successfully",
    data: { draws: items },
    meta,
  });
});

export const getDraw = asyncHandler(async (req, res) => {
  const draw = await drawService.getDraw(
    req.user,
    req.params.groupId,
    req.params.drawId,
  );

  return sendSuccess(res, {
    message: "Draw retrieved successfully",
    data: { draw },
  });
});
