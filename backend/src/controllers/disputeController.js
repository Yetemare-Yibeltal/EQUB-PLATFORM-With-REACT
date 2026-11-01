import * as disputeService from "../services/disputeService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createDispute = asyncHandler(async (req, res) => {
  const dispute = await disputeService.createDispute(
    req.user,
    req.params.groupId,
    req.body,
  );

  return sendSuccess(res, {
    statusCode: 201,
    message: "Dispute reported successfully",
    data: { dispute },
  });
});

export const listGroupDisputes = asyncHandler(async (req, res) => {
  const { items, meta } = await disputeService.listGroupDisputes(
    req.user,
    req.params.groupId,
    req.query,
  );

  return sendSuccess(res, {
    message: "Disputes retrieved successfully",
    data: { disputes: items },
    meta,
  });
});

export const listAllDisputes = asyncHandler(async (req, res) => {
  const { items, meta } = await disputeService.listAllDisputes(req.query);

  return sendSuccess(res, {
    message: "Disputes retrieved successfully",
    data: { disputes: items },
    meta,
  });
});

export const getDispute = asyncHandler(async (req, res) => {
  const dispute = await disputeService.getDispute(
    req.user,
    req.params.disputeId,
    { groupId: req.params.groupId },
  );

  return sendSuccess(res, {
    message: "Dispute retrieved successfully",
    data: { dispute },
  });
});

export const addComment = asyncHandler(async (req, res) => {
  const dispute = await disputeService.addComment(
    req.user,
    req.params.disputeId,
    req.body.body,
    { groupId: req.params.groupId },
  );

  return sendSuccess(res, {
    message: "Comment added successfully",
    data: { dispute },
  });
});

export const decideDispute = asyncHandler(async (req, res) => {
  const dispute = await disputeService.decideDispute(
    req.user,
    req.params.disputeId,
    req.body,
    { groupId: req.params.groupId },
  );

  return sendSuccess(res, {
    message: "Dispute updated successfully",
    data: { dispute },
  });
});
