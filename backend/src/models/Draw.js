import mongoose from "mongoose";
import { PAYOUT_ORDER_METHOD_VALUES } from "../constants/payoutOrderMethods.js";

const participantSchema = new mongoose.Schema(
  {
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
  },
  { _id: false },
);

const drawSchema = new mongoose.Schema(
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
    cycleNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    method: {
      type: String,
      enum: PAYOUT_ORDER_METHOD_VALUES,
      required: true,
    },
    seed: {
      type: String,
      default: null,
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "A draw needs at least one participant",
      },
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    winnerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    winnerIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drawnAt: {
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

drawSchema.index({ group: 1, drawnAt: 1 });

const Draw = mongoose.models.Draw || mongoose.model("Draw", drawSchema);

export default Draw;
