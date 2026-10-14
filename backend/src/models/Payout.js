import mongoose from "mongoose";
import { MANUAL_PAYMENT_METHOD_VALUES } from "../constants/paymentMethods.js";
import {
  PAYOUT_STATUSES,
  PAYOUT_STATUS_VALUES,
} from "../constants/payoutStatuses.js";

const wholeNumber = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number",
};

const payoutSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    cycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cycle",
      required: true,
      unique: true,
    },
    draw: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: wholeNumber,
    },
    status: {
      type: String,
      enum: PAYOUT_STATUS_VALUES,
      default: PAYOUT_STATUSES.PENDING,
    },
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: MANUAL_PAYMENT_METHOD_VALUES,
    },
    reference: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

payoutSchema.index({ group: 1, createdAt: 1 });
payoutSchema.index({ user: 1, status: 1, createdAt: -1 });

const Payout = mongoose.models.Payout || mongoose.model("Payout", payoutSchema);

export default Payout;
