import { Router } from "express";
import { listGroupAuditLogs } from "../controllers/auditController.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  groupAuditParamsSchema,
  listGroupAuditLogsQuerySchema,
} from "../validators/auditValidator.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  validateRequest({
    params: groupAuditParamsSchema,
    query: listGroupAuditLogsQuerySchema,
  }),
  listGroupAuditLogs,
);

export default router;
