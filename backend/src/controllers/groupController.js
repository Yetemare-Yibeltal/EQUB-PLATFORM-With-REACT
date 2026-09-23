const Group = require("../models/Group");

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ organizer: req.organizerId }).sort({
      createdAt: -1,
    });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.groupId,
      organizer: req.organizerId,
    });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, contributionAmount, frequency } = req.body;

    if (!name || !contributionAmount || !frequency) {
      return res
        .status(400)
        .json({
          message: "name, contributionAmount, and frequency are required",
        });
    }

    const group = await Group.create({
      organizer: req.organizerId,
      name,
      contributionAmount,
      frequency,
    });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGroupStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["draft", "active", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          message: `status must be one of: ${allowedStatuses.join(", ")}`,
        });
    }

    const group = await Group.findOneAndUpdate(
      { _id: req.params.groupId, organizer: req.organizerId },
      { status },
      { new: true },
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
