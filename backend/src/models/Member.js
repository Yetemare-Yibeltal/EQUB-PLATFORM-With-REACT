import mongoose from "mongoose";
import { MEMBER_ROLES, MEMBER_ROLE_VALUES } from "../constants/memberRoles.js";
import {
  MEMBER_STATUSES,
  MEMBER_STATUS_VALUES,
} from "../constants/memberStatuses.js";

const memberSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: MEMBER_ROLE_VALUES,
      default: MEMBER_ROLES.MEMBER,
    },
    status: {
      type: String,
      enum: MEMBER_STATUS_VALUES,
      default: MEMBER_STATUSES.PENDING,
    },
    joinedAt: {
      type: Date,
    },
    payoutPosition: {
      type: Number,
      default: null,
      min: 1,
    },
    hasReceivedPayout: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    removedAt: {
      type: Date,
    },
    leftAt: {
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

memberSchema.index({ group: 1, user: 1 }, { unique: true });
memberSchema.index({ user: 1, status: 1, createdAt: -1 });
memberSchema.index({ group: 1, status: 1, createdAt: 1 });
memberSchema.index(
  { group: 1, payoutPosition: 1 },
  {
    unique: true,
    partialFilterExpression: { payoutPosition: { $type: "number" } },
  },
);

const Member = mongoose.models.Member || mongoose.model("Member", memberSchema);

export default Member;
