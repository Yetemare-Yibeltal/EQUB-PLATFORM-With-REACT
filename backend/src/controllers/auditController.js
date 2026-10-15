import * as auditService from "../services/auditService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { items, meta } = await auditService.listLogs(req.query);

  return sendSuccess(res, {
    message: "Audit logs retrieved successfully",
    data: { auditLogs: items },
    meta,
  });
});

export const listGroupAuditLogs = asyncHandler(async (req, res) => {
  const { items, meta } = await auditService.listGroupLogs(
    req.user,
    req.params.groupId,
    req.query,
  );

  return sendSuccess(res, {
    message: "Audit logs retrieved successfully",
    data: { auditLogs: items },
    meta,
  });
});
