const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      // not required yet - groupController doesn't set this until auth
      // protection is added to group creation in a later file
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contributionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true,
    },
    memberCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Group", groupSchema);
