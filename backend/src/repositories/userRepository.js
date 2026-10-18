import User from "../models/User.js";
import { paginate } from "../utils/pagination.js";

const MAX_ACTIVE_SESSIONS = 5;

const applyOptions = (query, { select, session, lean = false } = {}) => {
  let result = query;
  if (select) result = result.select(select);
  if (session) result = result.session(session);
  if (lean) result = result.lean();
  return result;
};

export const create = async (data, { session } = {}) => {
  const [user] = await User.create([data], { session });
  return user;
};

export const findById = (id, options = {}) =>
  applyOptions(User.findById(id), options).exec();

export const findByIdWithPassword = (id) =>
  User.findById(id).select("+passwordHash").exec();

export const findByPhone = (phone) => User.findOne({ phone }).exec();

export const findByEmail = (email) => User.findOne({ email }).exec();

export const findByIdentifier = (
  identifier,
  { includePassword = false } = {},
) => {
  const filter = identifier.includes("@")
    ? { email: identifier }
    : { phone: identifier };
  const query = User.findOne(filter);
  return (includePassword ? query.select("+passwordHash") : query).exec();
};

export const existsByPhone = async (phone) =>
  (await User.exists({ phone })) !== null;

export const existsByEmail = async (email) =>
  (await User.exists({ email })) !== null;

export const updateById = (id, update, { session } = {}) =>
  User.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
    session,
  }).exec();

export const incrementFailedLogin = (id) =>
  User.findByIdAndUpdate(
    id,
    { $inc: { failedLoginAttempts: 1 } },
    { new: true },
  ).exec();

export const lockAccount = (id, lockUntil) =>
  User.updateOne(
    { _id: id },
    { $set: { lockUntil, failedLoginAttempts: 0 } },
  ).exec();

export const recordSuccessfulLogin = (id) =>
  User.findByIdAndUpdate(
    id,
    {
      $set: {
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date(),
      },
    },
    { new: true },
  ).exec();

export const addRefreshToken = (id, entry) =>
  User.updateOne(
    { _id: id },
    {
      $push: {
        refreshTokens: { $each: [entry], $slice: -MAX_ACTIVE_SESSIONS },
      },
    },
  ).exec();

export const consumeRefreshToken = (id, tokenHash) =>
  User.findOneAndUpdate(
    { _id: id, "refreshTokens.tokenHash": tokenHash },
    { $pull: { refreshTokens: { tokenHash } } },
  ).exec();

export const removeRefreshToken = (id, tokenHash) =>
  User.updateOne(
    { _id: id },
    { $pull: { refreshTokens: { tokenHash } } },
  ).exec();

export const clearRefreshTokens = (id) =>
  User.updateOne({ _id: id }, { $set: { refreshTokens: [] } }).exec();

export const setPasswordResetToken = (id, tokenHash, expiresAt) =>
  User.updateOne(
    { _id: id },
    {
      $set: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    },
  ).exec();

export const resetPasswordByToken = (tokenHash, passwordHash) =>
  User.findOneAndUpdate(
    {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null,
        refreshTokens: [],
      },
      $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" },
    },
    { new: true },
  ).exec();

export const setEmailVerificationToken = (id, tokenHash, expiresAt) =>
  User.updateOne(
    { _id: id },
    {
      $set: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      },
    },
  ).exec();

export const verifyEmailByToken = (tokenHash) =>
  User.findOneAndUpdate(
    {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    },
    {
      $set: { emailVerified: true },
      $unset: {
        emailVerificationTokenHash: "",
        emailVerificationExpiresAt: "",
      },
    },
    { new: true },
  ).exec();

export const list = (filter, options) => paginate(User, filter, options);
