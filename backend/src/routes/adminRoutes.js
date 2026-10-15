import { Router } from "express";
import { listAuditLogs } from "../controllers/auditController.js";
import {
  getOverview,
  listGroups,
  listJobs,
  resolvePaymentReview,
  runJob,
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiter.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  jobNameParamSchema,
  listAdminGroupsQuerySchema,
  paymentIdParamSchema,
  resolvePaymentReviewSchema,
} from "../validators/adminValidator.js";
import { listAuditLogsQuerySchema } from "../validators/auditValidator.js";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/overview", getOverview);
router.get(
  "/groups",
  validateRequest({ query: listAdminGroupsQuerySchema }),
  listGroups,
);
router.get(
  "/audit-logs",
  validateRequest({ query: listAuditLogsQuerySchema }),
  listAuditLogs,
);
router.post(
  "/payments/:paymentId/resolve-review",
  sensitiveActionLimiter,
  validateRequest({
    params: paymentIdParamSchema,
    body: resolvePaymentReviewSchema,
  }),
  resolvePaymentReview,
);
router.get("/jobs", listJobs);
router.post(
  "/jobs/:name/run",
  sensitiveActionLimiter,
  validateRequest({ params: jobNameParamSchema }),
  runJob,
);

export default router;
