import mongoose from "mongoose";
import {
  CYCLE_STATUSES,
  CYCLE_STATUS_VALUES,
} from "../constants/cycleStatuses.js";

const wholeNumber = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number",
};

const cycleSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    number: {
      type: Number,
      required: true,
      min: 1,
      validate: wholeNumber,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: CYCLE_STATUS_VALUES,
      default: CYCLE_STATUSES.UPCOMING,
    },
    expectedCount: {
      type: Number,
      required: true,
      min: 1,
      validate: wholeNumber,
    },
    resolvedCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: wholeNumber,
    },
    potAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: wholeNumber,
    },
    collectedAmount: {
      type: Number,
      default: 0,
      min: 0,
      validate: wholeNumber,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    collectedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

cycleSchema.virtual("pendingCount").get(function getPendingCount() {
  return Math.max(this.expectedCount - this.resolvedCount, 0);
});

cycleSchema.virtual("progressPercent").get(function getProgressPercent() {
  return this.expectedCount > 0
    ? Math.round((this.resolvedCount / this.expectedCount) * 100)
    : 0;
});

cycleSchema.index({ group: 1, number: 1 }, { unique: true });
cycleSchema.index({ group: 1, status: 1, number: 1 });

const Cycle = mongoose.models.Cycle || mongoose.model("Cycle", cycleSchema);

export default Cycle;
