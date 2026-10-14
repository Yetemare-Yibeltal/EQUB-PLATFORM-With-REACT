import { CYCLE_STATUSES } from "../constants/cycleStatuses.js";
import Cycle from "../models/Cycle.js";

export const createMany = (items, { session } = {}) =>
  Cycle.insertMany(items, { session });

export const findById = (id, { session } = {}) =>
  Cycle.findById(id)
    .session(session || null)
    .exec();

export const findByGroup = (groupId) =>
  Cycle.find({ group: groupId }).sort({ number: 1 }).exec();

export const findCurrent = (groupId) =>
  Cycle.findOne({
    group: groupId,
    status: { $in: [CYCLE_STATUSES.COLLECTING, CYCLE_STATUSES.COLLECTED] },
  })
    .sort({ number: 1 })
    .exec();

export const recordResolution = (id, collectedAmount, { session } = {}) =>
  Cycle.findOneAndUpdate(
    { _id: id, status: CYCLE_STATUSES.COLLECTING },
    { $inc: { resolvedCount: 1, collectedAmount } },
    { new: true, session },
  ).exec();

export const markCollected = (id, { session } = {}) =>
  Cycle.findOneAndUpdate(
    {
      _id: id,
      status: CYCLE_STATUSES.COLLECTING,
      $expr: { $gte: ["$resolvedCount", "$expectedCount"] },
    },
    { $set: { status: CYCLE_STATUSES.COLLECTED, collectedAt: new Date() } },
    { new: true, session },
  ).exec();
