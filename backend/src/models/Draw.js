const mongoose = require("mongoose");

const drawSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    cycle: {
      type: Number,
      required: true,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    drawnAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

drawSchema.index({ group: 1, cycle: 1 }, { unique: true });

module.exports = mongoose.model("Draw", drawSchema);
