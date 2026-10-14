import { Router } from "express";
import { listMyPayouts } from "../controllers/payoutController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { listMyPayoutsQuerySchema } from "../validators/payoutValidator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/mine",
  validateRequest({ query: listMyPayoutsQuerySchema }),
  listMyPayouts,
);

export default router;
