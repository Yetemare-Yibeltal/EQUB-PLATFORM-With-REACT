import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  logoutAll,
  refresh,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  authLimiter,
  sensitiveActionLimiter,
} from "../middleware/rateLimiter.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validators/authValidator.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateRequest({ body: registerSchema }),
  register,
);
router.post(
  "/login",
  authLimiter,
  validateRequest({ body: loginSchema }),
  login,
);
router.post("/refresh", validateRequest({ body: refreshTokenSchema }), refresh);
router.post("/logout", validateRequest({ body: refreshTokenSchema }), logout);
router.post("/logout-all", authenticate, logoutAll);
router.post(
  "/change-password",
  authenticate,
  sensitiveActionLimiter,
  validateRequest({ body: changePasswordSchema }),
  changePassword,
);
router.post(
  "/forgot-password",
  authLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validateRequest({ body: resetPasswordSchema }),
  resetPassword,
);
router.post(
  "/verify-email",
  authLimiter,
  validateRequest({ body: verifyEmailSchema }),
  verifyEmail,
);
router.post(
  "/resend-verification",
  authenticate,
  sensitiveActionLimiter,
  resendVerification,
);

export default router;
