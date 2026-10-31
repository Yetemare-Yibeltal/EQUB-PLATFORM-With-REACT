import mongoose from "mongoose";
import { DEFAULT_LANGUAGE, LANGUAGE_VALUES } from "../constants/languages.js";
import { USER_ROLES, USER_ROLE_VALUES } from "../constants/roles.js";
import {
  USER_STATUSES,
  USER_STATUS_VALUES,
} from "../constants/userStatuses.js";

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: "", maxlength: 500 },
    ipAddress: { type: String, default: "", maxlength: 100 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name must not exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [
        /^\+251[79]\d{8}$/,
        "Phone number must be a valid Ethiopian mobile number",
      ],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email must not exceed 254 characters"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      default: USER_ROLES.USER,
    },
    status: {
      type: String,
      enum: USER_STATUS_VALUES,
      default: USER_STATUSES.ACTIVE,
    },
    language: {
      type: String,
      enum: LANGUAGE_VALUES,
      default: DEFAULT_LANGUAGE,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    lastLoginAt: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
    emailVerificationTokenHash: {
      type: String,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpiresAt;
        delete ret.emailVerificationTokenHash;
        delete ret.emailVerificationExpiresAt;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  },
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } },
);
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
