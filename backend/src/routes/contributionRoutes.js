import { Router } from "express";
import { listMyContributions } from "../controllers/contributionController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { listMyContributionsQuerySchema } from "../validators/contributionValidator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/mine",
  validateRequest({ query: listMyContributionsQuerySchema }),
  listMyContributions,
);

export default router;
