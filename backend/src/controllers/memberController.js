const Member = require("../models/Member");
const Group = require("../models/Group");

async function assertGroupOwnership(groupId, organizerId) {
  const group = await Group.findOne({ _id: groupId, organizer: organizerId });
  return group;
}

exports.getMembers = async (req, res) => {
  try {
    const group = await assertGroupOwnership(
      req.params.groupId,
      req.organizerId,
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const members = await Member.find({ group: req.params.groupId }).sort({
      payoutPosition: 1,
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const group = await assertGroupOwnership(
      req.params.groupId,
      req.organizerId,
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const count = await Member.countDocuments({ group: req.params.groupId });
    const member = await Member.create({
      group: req.params.groupId,
      name,
      phone,
      payoutPosition: count + 1,
    });

    group.memberCount = count + 1;
    await group.save();

    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const group = await assertGroupOwnership(
      req.params.groupId,
      req.organizerId,
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const member = await Member.findOneAndDelete({
      _id: req.params.memberId,
      group: req.params.groupId,
    });
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    group.memberCount = Math.max(0, group.memberCount - 1);
    await group.save();

    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
