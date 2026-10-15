import mongoose from "mongoose";
import { NOTIFICATION_TYPE_VALUES } from "../constants/notificationTypes.js";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPE_VALUES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    cycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cycle",
    },
    entityType: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    dedupeKey: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.dedupeKey;
        return ret;
      },
    },
  },
);

notificationSchema.virtual("isRead").get(function getIsRead() {
  return this.readAt !== null && this.readAt !== undefined;
});

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index(
  { user: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } },
);
notificationSchema.index({ createdAt: 1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
