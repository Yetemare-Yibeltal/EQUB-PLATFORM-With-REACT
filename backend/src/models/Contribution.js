import mongoose from "mongoose";
import {
  CONTRIBUTION_STATUSES,
  CONTRIBUTION_STATUS_VALUES,
} from "../constants/contributionStatuses.js";
import { PAYMENT_METHOD_VALUES } from "../constants/paymentMethods.js";

const wholeNumber = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number",
};

const contributionSchema = new mongoose.Schema(
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
    latePenaltyAmount: {
      type: Number,
      default: 0,
      min: 0,
      validate: wholeNumber,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    lateAfter: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: CONTRIBUTION_STATUS_VALUES,
      default: CONTRIBUTION_STATUSES.PENDING,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
      validate: wholeNumber,
    },
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
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
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    waivedAt: {
      type: Date,
    },
    waiveReason: {
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

contributionSchema.virtual("isOverdue").get(function getIsOverdue() {
  return (
    this.status === CONTRIBUTION_STATUSES.PENDING &&
    Boolean(this.lateAfter) &&
    this.lateAfter.getTime() <= Date.now()
  );
});

contributionSchema
  .virtual("amountOutstanding")
  .get(function getAmountOutstanding() {
    if (this.status !== CONTRIBUTION_STATUSES.PENDING) return 0;
    return this.amount + (this.isOverdue ? this.latePenaltyAmount : 0);
  });

contributionSchema.index({ cycle: 1, member: 1 }, { unique: true });
contributionSchema.index({ group: 1, cycle: 1, status: 1 });
contributionSchema.index({ user: 1, status: 1, dueDate: 1 });
contributionSchema.index({ status: 1, lateAfter: 1 });

const Contribution =
  mongoose.models.Contribution ||
  mongoose.model("Contribution", contributionSchema);

export default Contribution;
