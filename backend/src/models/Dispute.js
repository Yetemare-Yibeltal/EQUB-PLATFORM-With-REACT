import mongoose from "mongoose";
import { DISPUTE_CATEGORY_VALUES } from "../constants/disputeCategories.js";
import {
  DISPUTE_STATUSES,
  DISPUTE_STATUS_VALUES,
} from "../constants/disputeStatuses.js";

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const disputeSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    cycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cycle",
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: String,
      enum: DISPUTE_CATEGORY_VALUES,
      required: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [3, "Subject must be at least 3 characters"],
      maxlength: [120, "Subject must not exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description must not exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: DISPUTE_STATUS_VALUES,
      default: DISPUTE_STATUSES.OPEN,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    decidedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

disputeSchema.index({ group: 1, status: 1, createdAt: -1 });
disputeSchema.index({ reporter: 1, createdAt: -1 });
disputeSchema.index({ status: 1, createdAt: -1 });

const Dispute =
  mongoose.models.Dispute || mongoose.model("Dispute", disputeSchema);

export default Dispute;
