import mongoose from "mongoose";
import { PAYMENT_METHOD_VALUES } from "../constants/paymentMethods.js";
import {
  TRANSACTION_DIRECTION_VALUES,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_VALUES,
} from "../constants/transactionTypes.js";

const wholeNumber = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number",
};

const transactionSchema = new mongoose.Schema(
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
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: TRANSACTION_TYPE_VALUES,
      required: true,
    },
    direction: {
      type: String,
      enum: TRANSACTION_DIRECTION_VALUES,
      required: true,
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
    currency: {
      type: String,
      default: "ETB",
      uppercase: true,
      trim: true,
    },
    method: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      required: true,
    },
    reference: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    occurredAt: {
      type: Date,
      default: Date.now,
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

transactionSchema.index({ group: 1, occurredAt: -1 });
transactionSchema.index({ user: 1, occurredAt: -1 });
transactionSchema.index({ cycle: 1, type: 1 });
transactionSchema.index(
  { contribution: 1 },
  {
    unique: true,
    partialFilterExpression: { type: TRANSACTION_TYPES.CONTRIBUTION },
  },
);

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default Transaction;
