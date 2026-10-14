import { Router } from "express";
import {
  getCurrentCycle,
  getCycle,
  listCycles,
} from "../controllers/cycleController.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  cycleParamsSchema,
  groupParamSchema,
} from "../validators/cycleValidator.js";

const router = Router({ mergeParams: true });

router.get("/", validateRequest({ params: groupParamSchema }), listCycles);
router.get(
  "/current",
  validateRequest({ params: groupParamSchema }),
  getCurrentCycle,
);
router.get(
  "/:cycleId",
  validateRequest({ params: cycleParamsSchema }),
  getCycle,
);

export default router;
