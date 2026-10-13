import { Router } from "express";
import {
  approveMember,
  listMembers,
  rejectMember,
  removeMember,
} from "../controllers/memberController.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  listMembersParamsSchema,
  listMembersQuerySchema,
  memberParamsSchema,
} from "../validators/memberValidator.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  validateRequest({
    params: listMembersParamsSchema,
    query: listMembersQuerySchema,
  }),
  listMembers,
);
router.post(
  "/:memberId/approve",
  validateRequest({ params: memberParamsSchema }),
  approveMember,
);
router.post(
  "/:memberId/reject",
  validateRequest({ params: memberParamsSchema }),
  rejectMember,
);
router.delete(
  "/:memberId",
  validateRequest({ params: memberParamsSchema }),
  removeMember,
);

export default router;
