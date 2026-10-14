import mongoose from "mongoose";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_VALUES,
} from "../constants/paymentProviders.js";
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_VALUES,
} from "../constants/paymentStatuses.js";

const wholeNumber = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number",
};

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    txRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: PAYMENT_PROVIDER_VALUES,
      default: PAYMENT_PROVIDERS.CHAPA,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: wholeNumber,
    },
    penaltyAmount: {
      type: Number,
      default: 0,
      min: 0,
      validate: wholeNumber,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    currency: {
      type: String,
      default: "ETB",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUSES.PENDING,
    },
    checkoutUrl: {
      type: String,
      trim: true,
      default: "",
    },
    providerReference: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    method: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    failureReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    verifiedAt: {
      type: Date,
    },
    requiresReview: {
      type: Boolean,
      default: false,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
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

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ group: 1, createdAt: -1 });
paymentSchema.index({ contribution: 1, status: 1, createdAt: -1 });
paymentSchema.index({ requiresReview: 1, createdAt: -1 });

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
