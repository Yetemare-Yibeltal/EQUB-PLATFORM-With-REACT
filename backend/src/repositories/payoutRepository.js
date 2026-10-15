import { PAYOUT_STATUSES } from "../constants/payoutStatuses.js";
import Payout from "../models/Payout.js";
import { paginate } from "../utils/pagination.js";

export const create = async (data, { session } = {}) => {
  const [payout] = await Payout.create([data], { session });
  return payout;
};

export const findById = (id, { session } = {}) =>
  Payout.findById(id)
    .session(session || null)
    .exec();

export const findPendingBefore = (before) =>
  Payout.find({ status: PAYOUT_STATUSES.PENDING, createdAt: { $lte: before } })
    .populate([
      { path: "group", select: "name status createdBy" },
      { path: "cycle", select: "number" },
      { path: "user", select: "fullName" },
    ])
    .exec();

export const transitionPending = (id, update, { session } = {}) =>
  Payout.findOneAndUpdate(
    { _id: id, status: PAYOUT_STATUSES.PENDING },
    update,
    {
      new: true,
      runValidators: true,
      session,
    },
  ).exec();

export const list = (filter, options) => paginate(Payout, filter, options);
