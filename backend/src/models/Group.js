import mongoose from "mongoose";
import { CONTRIBUTION_FREQUENCY_VALUES } from "../constants/contributionFrequencies.js";
import {
  GROUP_STATUSES,
  GROUP_STATUS_VALUES,
} from "../constants/groupStatuses.js";
import {
  PAYOUT_ORDER_METHODS,
  PAYOUT_ORDER_METHOD_VALUES,
} from "../constants/payoutOrderMethods.js";

const wholeNumber = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number",
};

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      minlength: [3, "Group name must be at least 3 characters"],
      maxlength: [100, "Group name must not exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must not exceed 1000 characters"],
      default: "",
    },
    contributionAmount: {
      type: Number,
      required: [true, "Contribution amount is required"],
      min: [100, "Contribution amount must be at least 100 santim"],
      max: [100000000, "Contribution amount is too large"],
      validate: wholeNumber,
    },
    frequency: {
      type: String,
      enum: CONTRIBUTION_FREQUENCY_VALUES,
      required: [true, "Contribution frequency is required"],
    },
    maxMembers: {
      type: Number,
      required: [true, "Maximum members is required"],
      min: [2, "A group needs at least 2 members"],
      max: [100, "A group cannot exceed 100 members"],
      validate: wholeNumber,
    },
    memberCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: wholeNumber,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    status: {
      type: String,
      enum: GROUP_STATUS_VALUES,
      default: GROUP_STATUSES.OPEN,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    latePenaltyAmount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100000000,
      validate: wholeNumber,
    },
    gracePeriodDays: {
      type: Number,
      default: 0,
      min: 0,
      max: 30,
      validate: wholeNumber,
    },
    payoutOrderMethod: {
      type: String,
      enum: PAYOUT_ORDER_METHOD_VALUES,
      default: PAYOUT_ORDER_METHODS.RANDOM_DRAW,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: 500,
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

groupSchema.virtual("potAmount").get(function getPotAmount() {
  return this.contributionAmount * this.memberCount;
});

groupSchema.virtual("spotsLeft").get(function getSpotsLeft() {
  return Math.max(this.maxMembers - this.memberCount, 0);
});

groupSchema.virtual("isFull").get(function getIsFull() {
  return this.memberCount >= this.maxMembers;
});

groupSchema.index({ createdBy: 1, createdAt: -1 });
groupSchema.index({ status: 1, createdAt: -1 });

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;
