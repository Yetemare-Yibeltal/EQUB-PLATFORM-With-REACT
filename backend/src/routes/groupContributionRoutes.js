import { Router } from "express";
import {
  listContributions,
  recordContribution,
  waiveContribution,
} from "../controllers/contributionController.js";
import { submitProof } from "../controllers/paymentProofController.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiter.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  contributionParamsSchema,
  groupContributionsParamsSchema,
  listContributionsQuerySchema,
  recordContributionSchema,
  waiveContributionSchema,
} from "../validators/contributionValidator.js";
import {
  contributionProofParamsSchema,
  submitProofSchema,
} from "../validators/paymentProofValidator.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  validateRequest({
    params: groupContributionsParamsSchema,
    query: listContributionsQuerySchema,
  }),
  listContributions,
);
router.post(
  "/:contributionId/pay",
  validateRequest({
    params: contributionParamsSchema,
    body: recordContributionSchema,
  }),
  recordContribution,
);
router.post(
  "/:contributionId/proof",
  sensitiveActionLimiter,
  validateRequest({
    params: contributionProofParamsSchema,
    body: submitProofSchema,
  }),
  submitProof,
);
router.post(
  "/:contributionId/waive",
  validateRequest({
    params: contributionParamsSchema,
    body: waiveContributionSchema,
  }),
  waiveContribution,
);

export default router;
