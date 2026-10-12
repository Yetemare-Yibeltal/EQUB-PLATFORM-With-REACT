import { Router } from "express";
import {
  getMe,
  getUser,
  listUsers,
  updateMe,
  updateUserRole,
  updateUserStatus,
} from "../controllers/userController.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  listUsersQuerySchema,
  updateProfileSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from "../validators/userValidator.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMe);
router.patch("/me", validateRequest({ body: updateProfileSchema }), updateMe);

router.get(
  "/",
  requireAdmin,
  validateRequest({ query: listUsersQuerySchema }),
  listUsers,
);
router.get(
  "/:userId",
  requireAdmin,
  validateRequest({ params: userIdParamSchema }),
  getUser,
);
router.patch(
  "/:userId/status",
  requireAdmin,
  validateRequest({ params: userIdParamSchema, body: updateUserStatusSchema }),
  updateUserStatus,
);
router.patch(
  "/:userId/role",
  requireAdmin,
  validateRequest({ params: userIdParamSchema, body: updateUserRoleSchema }),
  updateUserRole,
);

export default router;
