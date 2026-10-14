import { Router } from "express";
import { listMyTransactions } from "../controllers/transactionController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { listMyTransactionsQuerySchema } from "../validators/transactionValidator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/mine",
  validateRequest({ query: listMyTransactionsQuerySchema }),
  listMyTransactions,
);

export default router;
