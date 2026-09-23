const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getGroups,
  getGroupById,
  createGroup,
  updateGroupStatus,
} = require("../controllers/groupController");

router.use(protect);

router.get("/", getGroups);
router.post("/", createGroup);
router.get("/:groupId", getGroupById);
router.patch("/:groupId/status", updateGroupStatus);

module.exports = router;
