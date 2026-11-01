import { Router } from "express";
import {
  addComment,
  createDispute,
  decideDispute,
  getDispute,
  listGroupDisputes,
} from "../controllers/disputeController.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiter.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  addDisputeCommentSchema,
  createDisputeSchema,
  decideDisputeSchema,
  groupDisputeParamsSchema,
  groupDisputesParamSchema,
  listDisputesQuerySchema,
} from "../validators/disputeValidator.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  sensitiveActionLimiter,
  validateRequest({
    params: groupDisputesParamSchema,
    body: createDisputeSchema,
  }),
  createDispute,
);
router.get(
  "/",
  validateRequest({
    params: groupDisputesParamSchema,
    query: listDisputesQuerySchema,
  }),
  listGroupDisputes,
);
router.get(
  "/:disputeId",
  validateRequest({ params: groupDisputeParamsSchema }),
  getDispute,
);
router.post(
  "/:disputeId/comments",
  validateRequest({
    params: groupDisputeParamsSchema,
    body: addDisputeCommentSchema,
  }),
  addComment,
);
router.post(
  "/:disputeId/decision",
  sensitiveActionLimiter,
  validateRequest({
    params: groupDisputeParamsSchema,
    body: decideDisputeSchema,
  }),
  decideDispute,
);

export default router;
