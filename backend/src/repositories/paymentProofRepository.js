import { PAYMENT_PROOF_STATUSES } from "../constants/paymentProofStatuses.js";
import PaymentProof from "../models/PaymentProof.js";
import { paginate } from "../utils/pagination.js";

export const create = async (data, { session } = {}) => {
  const [proof] = await PaymentProof.create([data], { session });
  return proof;
};

export const findById = (id, { session } = {}) =>
  PaymentProof.findById(id).session(session || null);

export const findPendingByContribution = (contributionId) =>
  PaymentProof.findOne({
    contribution: contributionId,
    status: PAYMENT_PROOF_STATUSES.PENDING,
  });

export const transition = (id, fromStatuses, update, { session } = {}) =>
  PaymentProof.findOneAndUpdate(
    { _id: id, status: { $in: fromStatuses } },
    { $set: update },
    { new: true, session },
  );

export const list = (filter, options) =>
  paginate(PaymentProof, filter, options);
