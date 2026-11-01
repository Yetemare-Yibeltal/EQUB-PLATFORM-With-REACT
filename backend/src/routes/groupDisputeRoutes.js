import { Router } from "express";
import { startGroup } from "../controllers/cycleController.js";
import {
  cancelGroup,
  createGroup,
  getGroup,
  listGroups,
  previewGroup,
  regenerateInviteCode,
  updateGroup,
} from "../controllers/groupController.js";
import { joinGroup, leaveGroup } from "../controllers/memberController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiter.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  cancelGroupSchema,
  createGroupSchema,
  groupIdParamSchema,
  inviteCodeParamSchema,
  joinGroupSchema,
  listGroupsQuerySchema,
  updateGroupSchema,
} from "../validators/groupValidator.js";
import cycleRoutes from "./cycleRoutes.js";
import drawRoutes from "./drawRoutes.js";
import groupAuditRoutes from "./groupAuditRoutes.js";
import groupContributionRoutes from "./groupContributionRoutes.js";
import groupDisputeRoutes from "./groupDisputeRoutes.js";
import groupPayoutRoutes from "./groupPayoutRoutes.js";
import groupReportRoutes from "./groupReportRoutes.js";
import groupTransactionRoutes from "./groupTransactionRoutes.js";
import memberRoutes from "./memberRoutes.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  sensitiveActionLimiter,
  validateRequest({ body: createGroupSchema }),
  createGroup,
);
router.get("/", validateRequest({ query: listGroupsQuerySchema }), listGroups);

router.get(
  "/preview/:inviteCode",
  validateRequest({ params: inviteCodeParamSchema }),
  previewGroup,
);
router.post(
  "/join",
  sensitiveActionLimiter,
  validateRequest({ body: joinGroupSchema }),
  joinGroup,
);

router.get(
  "/:groupId",
  validateRequest({ params: groupIdParamSchema }),
  getGroup,
);
router.patch(
  "/:groupId",
  validateRequest({ params: groupIdParamSchema, body: updateGroupSchema }),
  updateGroup,
);
router.post(
  "/:groupId/cancel",
  validateRequest({ params: groupIdParamSchema, body: cancelGroupSchema }),
  cancelGroup,
);
router.post(
  "/:groupId/invite-code/regenerate",
  validateRequest({ params: groupIdParamSchema }),
  regenerateInviteCode,
);
router.post(
  "/:groupId/leave",
  validateRequest({ params: groupIdParamSchema }),
  leaveGroup,
);
router.post(
  "/:groupId/start",
  validateRequest({ params: groupIdParamSchema }),
  startGroup,
);

router.use("/:groupId/members", memberRoutes);
router.use("/:groupId/cycles", cycleRoutes);
router.use("/:groupId/contributions", groupContributionRoutes);
router.use("/:groupId/transactions", groupTransactionRoutes);
router.use("/:groupId/draws", drawRoutes);
router.use("/:groupId/payouts", groupPayoutRoutes);
router.use("/:groupId/reports", groupReportRoutes);
router.use("/:groupId/audit-logs", groupAuditRoutes);
router.use("/:groupId/disputes", groupDisputeRoutes);

export default router;
