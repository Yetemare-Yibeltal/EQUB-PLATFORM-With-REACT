import mongoose from "mongoose";
import { PAYMENT_PROOF_METHOD_VALUES } from "../constants/paymentProofMethods.js";
import {
  PAYMENT_PROOF_STATUSES,
  PAYMENT_PROOF_STATUS_VALUES,
} from "../constants/paymentProofStatuses.js";

const normalizeReference = (value) =>
  String(value ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();

const paymentProofSchema = new mongoose.Schema(
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
    contribution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contribution",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    method: {
      type: String,
      enum: PAYMENT_PROOF_METHOD_VALUES,
      required: true,
    },
    reference: {
      type: String,
      required: [true, "Transaction reference is required"],
      set: normalizeReference,
      minlength: [4, "Transaction reference must be at least 4 characters"],
      maxlength: [100, "Transaction reference must not exceed 100 characters"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    screenshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoredFile",
    },
    status: {
      type: String,
      enum: PAYMENT_PROOF_STATUS_VALUES,
      default: PAYMENT_PROOF_STATUSES.PENDING,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    rejectReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.hasScreenshot = Boolean(ret.screenshot);
        delete ret._id;
        delete ret.screenshot;
        return ret;
      },
    },
  },
);

paymentProofSchema.index(
  { reference: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
);
paymentProofSchema.index({ group: 1, status: 1, createdAt: -1 });
paymentProofSchema.index({ user: 1, createdAt: -1 });
paymentProofSchema.index({ contribution: 1, status: 1 });
paymentProofSchema.index({ status: 1, createdAt: -1 });

const PaymentProof =
  mongoose.models.PaymentProof ||
  mongoose.model("PaymentProof", paymentProofSchema);

export default PaymentProof;
