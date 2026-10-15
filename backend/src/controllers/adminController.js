import * as adminService from "../services/adminService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getOverview = asyncHandler(async (req, res) => {
  const overview = await adminService.getOverview();

  return sendSuccess(res, {
    message: "Overview retrieved successfully",
    data: { overview },
  });
});

export const listGroups = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listGroups(req.query);

  return sendSuccess(res, {
    message: "Groups retrieved successfully",
    data: { groups: items },
    meta,
  });
});

export const resolvePaymentReview = asyncHandler(async (req, res) => {
  const payment = await adminService.resolvePaymentReview(
    req.user,
    req.params.paymentId,
    req.body.note,
  );

  return sendSuccess(res, {
    message: "Payment review resolved",
    data: { payment },
  });
});

export const listJobs = asyncHandler(async (req, res) => {
  const jobs = adminService.listJobs();

  return sendSuccess(res, {
    message: "Jobs retrieved successfully",
    data: { jobs },
  });
});

export const runJob = asyncHandler(async (req, res) => {
  const result = await adminService.runJob(req.user, req.params.name);

  return sendSuccess(res, {
    message: "Job completed successfully",
    data: result,
  });
});
