import * as adminPaymentProofService from "../services/adminPaymentProofService.js";
import * as paymentProofService from "../services/paymentProofService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const submitProof = asyncHandler(async (req, res) => {
  const proof = await paymentProofService.submitProof(
    req.user,
    req.params.groupId,
    req.params.contributionId,
    req.body,
    req.file,
  );

  return sendSuccess(res, {
    statusCode: 201,
    message: "Payment proof sent successfully",
    data: { proof },
  });
});

export const listProofs = asyncHandler(async (req, res) => {
  const { items, meta } = await paymentProofService.listGroupProofs(
    req.user,
    req.params.groupId,
    req.query,
  );

  return sendSuccess(res, {
    message: "Payment proofs retrieved successfully",
    data: { proofs: items },
    meta,
  });
});

export const listAllProofs = asyncHandler(async (req, res) => {
  const { items, meta } = await adminPaymentProofService.listAllProofs(
    req.query,
  );

  return sendSuccess(res, {
    message: "Payment proofs retrieved successfully",
    data: { proofs: items },
    meta,
  });
});

export const getScreenshot = asyncHandler(async (req, res) => {
  const image = await paymentProofService.getScreenshot(
    req.user,
    req.params.groupId,
    req.params.proofId,
  );

  res.set({
    "Content-Type": image.contentType,
    "Content-Length": String(image.size),
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
  });

  return res.status(200).end(image.data);
});

export const approveProof = asyncHandler(async (req, res) => {
  const proof = await paymentProofService.approveProof(
    req.user,
    req.params.groupId,
    req.params.proofId,
  );

  return sendSuccess(res, {
    message: "Payment proof approved successfully",
    data: { proof },
  });
});

export const rejectProof = asyncHandler(async (req, res) => {
  const proof = await paymentProofService.rejectProof(
    req.user,
    req.params.groupId,
    req.params.proofId,
    req.body.reason,
  );

  return sendSuccess(res, {
    message: "Payment proof rejected successfully",
    data: { proof },
  });
});
