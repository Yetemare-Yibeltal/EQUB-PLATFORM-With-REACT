import { ACTIVE_DISPUTE_STATUSES } from "../constants/disputeStatuses.js";
import Dispute from "../models/Dispute.js";
import { paginate } from "../utils/pagination.js";

export const create = async (data, { session } = {}) => {
  const [dispute] = await Dispute.create([data], { session });
  return dispute;
};

export const findById = (id, { session } = {}) =>
  Dispute.findById(id).session(session || null);

export const countActiveByReporter = (groupId, reporterId) =>
  Dispute.countDocuments({
    group: groupId,
    reporter: reporterId,
    status: { $in: ACTIVE_DISPUTE_STATUSES },
  });

export const transition = (id, fromStatuses, update, { session } = {}) =>
  Dispute.findOneAndUpdate(
    { _id: id, status: { $in: fromStatuses } },
    { $set: update },
    { new: true, session },
  );

export const addComment = (id, comment, { session } = {}) =>
  Dispute.findOneAndUpdate(
    { _id: id, status: { $in: ACTIVE_DISPUTE_STATUSES } },
    { $push: { comments: comment } },
    { new: true, session },
  );

export const list = (filter, options) => paginate(Dispute, filter, options);
