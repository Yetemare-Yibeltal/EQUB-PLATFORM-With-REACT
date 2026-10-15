import { PAYMENT_STATUSES } from "../constants/paymentStatuses.js";
import Payment from "../models/Payment.js";
import { paginate } from "../utils/pagination.js";

export const create = async (data, { session } = {}) => {
  const [payment] = await Payment.create([data], { session });
  return payment;
};

export const findById = (id, { session } = {}) =>
  Payment.findById(id)
    .session(session || null)
    .exec();

export const findByTxRef = (txRef, { session } = {}) =>
  Payment.findOne({ txRef })
    .session(session || null)
    .exec();

export const findReusablePending = ({
  contributionId,
  userId,
  amount,
  since,
}) =>
  Payment.findOne({
    contribution: contributionId,
    user: userId,
    amount,
    status: PAYMENT_STATUSES.PENDING,
    checkoutUrl: { $nin: ["", null] },
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .exec();

export const setCheckoutUrl = (id, checkoutUrl) =>
  Payment.findByIdAndUpdate(
    id,
    { $set: { checkoutUrl } },
    { new: true },
  ).exec();

export const transition = (id, fromStatuses, update, { session } = {}) =>
  Payment.findOneAndUpdate({ _id: id, status: { $in: fromStatuses } }, update, {
    new: true,
    runValidators: true,
    session,
  }).exec();

export const resolveReview = (id, reviewNote, { session } = {}) =>
  Payment.findOneAndUpdate(
    { _id: id, requiresReview: true },
    { $set: { requiresReview: false, reviewNote } },
    { new: true, session },
  ).exec();

export const list = (filter, options) => paginate(Payment, filter, options);
