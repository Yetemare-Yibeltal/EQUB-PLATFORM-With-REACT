import { CONTRIBUTION_STATUSES } from "../constants/contributionStatuses.js";
import Contribution from "../models/Contribution.js";
import { paginate } from "../utils/pagination.js";

export const createMany = (items, { session } = {}) =>
  Contribution.insertMany(items, { session });

export const findById = (id, { session } = {}) =>
  Contribution.findById(id)
    .session(session || null)
    .exec();

export const transitionPending = (id, update, { session } = {}) =>
  Contribution.findOneAndUpdate(
    { _id: id, status: CONTRIBUTION_STATUSES.PENDING },
    update,
    {
      new: true,
      runValidators: true,
      session,
    },
  ).exec();

export const countOverdue = (cycleId) =>
  Contribution.countDocuments({
    cycle: cycleId,
    status: CONTRIBUTION_STATUSES.PENDING,
    lateAfter: { $lte: new Date() },
  }).exec();

export const list = (filter, options) =>
  paginate(Contribution, filter, options);
