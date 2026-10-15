import { CONTRIBUTION_STATUSES } from "../constants/contributionStatuses.js";
import Contribution from "../models/Contribution.js";
import { paginate } from "../utils/pagination.js";

const REMINDER_POPULATE = [
  { path: "group", select: "name status createdBy" },
  { path: "cycle", select: "number" },
];

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

export const findDueSoon = ({ now, horizon }) =>
  Contribution.find({
    status: CONTRIBUTION_STATUSES.PENDING,
    dueDate: { $lte: horizon },
    lateAfter: { $gt: now },
  })
    .populate(REMINDER_POPULATE)
    .exec();

export const findOverdue = ({ now }) =>
  Contribution.find({
    status: CONTRIBUTION_STATUSES.PENDING,
    lateAfter: { $lte: now },
  })
    .populate(REMINDER_POPULATE)
    .exec();

export const list = (filter, options) =>
  paginate(Contribution, filter, options);
