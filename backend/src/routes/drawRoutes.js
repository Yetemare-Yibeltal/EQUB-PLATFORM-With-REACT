import { Router } from "express";
import {
  getDraw,
  listDraws,
  performDraw,
} from "../controllers/drawController.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiter.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  drawParamsSchema,
  groupDrawsParamsSchema,
  listDrawsQuerySchema,
  performDrawSchema,
} from "../validators/drawValidator.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  sensitiveActionLimiter,
  validateRequest({ params: groupDrawsParamsSchema, body: performDrawSchema }),
  performDraw,
);
router.get(
  "/",
  validateRequest({
    params: groupDrawsParamsSchema,
    query: listDrawsQuerySchema,
  }),
  listDraws,
);
router.get("/:drawId", validateRequest({ params: drawParamsSchema }), getDraw);

export default router;
