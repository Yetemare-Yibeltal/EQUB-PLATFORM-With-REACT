import { Router } from "express";
import {
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
  removeNotification,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  listNotificationsQuerySchema,
  notificationParamSchema,
} from "../validators/notificationValidator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validateRequest({ query: listNotificationsQuerySchema }),
  listNotifications,
);
router.get("/unread-count", getUnreadCount);
router.post("/read-all", markAllRead);
router.post(
  "/:notificationId/read",
  validateRequest({ params: notificationParamSchema }),
  markRead,
);
router.delete(
  "/:notificationId",
  validateRequest({ params: notificationParamSchema }),
  removeNotification,
);

export default router;
