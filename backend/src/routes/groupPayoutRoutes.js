import { Router } from "express";
import {
  getPayout,
  listGroupPayouts,
  recordPayout,
} from "../controllers/payoutController.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiter.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  groupPayoutsParamsSchema,
  listGroupPayoutsQuerySchema,
  payoutParamsSchema,
  recordPayoutSchema,
} from "../validators/payoutValidator.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  validateRequest({
    params: groupPayoutsParamsSchema,
    query: listGroupPayoutsQuerySchema,
  }),
  listGroupPayouts,
);
router.get(
  "/:payoutId",
  validateRequest({ params: payoutParamsSchema }),
  getPayout,
);
router.post(
  "/:payoutId/pay",
  sensitiveActionLimiter,
  validateRequest({ params: payoutParamsSchema, body: recordPayoutSchema }),
  recordPayout,
);

export default router;
