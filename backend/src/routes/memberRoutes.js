const express = require("express");
const router = express.Router({ mergeParams: true });
const protect = require("../middleware/authMiddleware");
const {
  getMembers,
  addMember,
  removeMember,
} = require("../controllers/memberController");

router.use(protect);

router.get("/", getMembers);
router.post("/", addMember);
router.delete("/:memberId", removeMember);

module.exports = router;
