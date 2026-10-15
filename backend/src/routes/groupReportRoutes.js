import { Router } from "express";
import {
  getGroupStatement,
  getMemberReliability,
} from "../controllers/reportController.js";
import validateRequest from "../middleware/validateRequest.js";
import { groupReportParamsSchema } from "../validators/reportValidator.js";

const router = Router({ mergeParams: true });

router.get(
  "/statement",
  validateRequest({ params: groupReportParamsSchema }),
  getGroupStatement,
);
router.get(
  "/reliability",
  validateRequest({ params: groupReportParamsSchema }),
  getMemberReliability,
);

export default router;
