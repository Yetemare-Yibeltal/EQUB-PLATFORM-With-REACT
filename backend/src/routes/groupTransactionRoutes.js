import { Router } from "express";
import {
  getGroupSummary,
  listGroupTransactions,
} from "../controllers/transactionController.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  groupTransactionsParamsSchema,
  listGroupTransactionsQuerySchema,
} from "../validators/transactionValidator.js";

const router = Router({ mergeParams: true });

router.get(
  "/summary",
  validateRequest({ params: groupTransactionsParamsSchema }),
  getGroupSummary,
);
router.get(
  "/",
  validateRequest({
    params: groupTransactionsParamsSchema,
    query: listGroupTransactionsQuerySchema,
  }),
  listGroupTransactions,
);

export default router;
