import { Router } from "express";
import {
  createCheckout,
  getPayment,
  handleCallback,
  handleWebhook,
  listMyPayments,
  listPayments,
  verifyPayment,
} from "../controllers/paymentController.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { sensitiveActionLimiter } from "../middleware/rateLimiter.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  callbackQuerySchema,
  checkoutSchema,
  listMyPaymentsQuerySchema,
  listPaymentsQuerySchema,
  txRefParamSchema,
} from "../validators/paymentValidator.js";

const router = Router();

router.post("/webhook", handleWebhook);
router.get(
  "/callback",
  validateRequest({ query: callbackQuerySchema }),
  handleCallback,
);

router.use(authenticate);

router.post(
  "/checkout",
  sensitiveActionLimiter,
  validateRequest({ body: checkoutSchema }),
  createCheckout,
);
router.get(
  "/mine",
  validateRequest({ query: listMyPaymentsQuerySchema }),
  listMyPayments,
);
router.get(
  "/",
  requireAdmin,
  validateRequest({ query: listPaymentsQuerySchema }),
  listPayments,
);
router.get(
  "/ref/:txRef",
  validateRequest({ params: txRefParamSchema }),
  getPayment,
);
router.post(
  "/ref/:txRef/verify",
  sensitiveActionLimiter,
  validateRequest({ params: txRefParamSchema }),
  verifyPayment,
);

export default router;
