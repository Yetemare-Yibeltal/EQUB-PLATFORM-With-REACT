import { Router } from "express";
import {
  approveProof,
  listProofs,
  rejectProof,
} from "../controllers/paymentProofController.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiter.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  groupProofsParamSchema,
  listProofsQuerySchema,
  proofParamsSchema,
  rejectProofSchema,
} from "../validators/paymentProofValidator.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  validateRequest({
    params: groupProofsParamSchema,
    query: listProofsQuerySchema,
  }),
  listProofs,
);
router.post(
  "/:proofId/approve",
  sensitiveActionLimiter,
  validateRequest({ params: proofParamsSchema }),
  approveProof,
);
router.post(
  "/:proofId/reject",
  sensitiveActionLimiter,
  validateRequest({ params: proofParamsSchema, body: rejectProofSchema }),
  rejectProof,
);

export default router;
