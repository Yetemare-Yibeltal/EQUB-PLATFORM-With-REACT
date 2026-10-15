import { Router } from "express";
import { getMyStatement } from "../controllers/reportController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMyStatement);

export default router;
