import mongoose from "mongoose";
import { CONTRIBUTION_STATUSES } from "../constants/contributionStatuses.js";
import { CYCLE_STATUSES } from "../constants/cycleStatuses.js";
import { PAYOUT_STATUSES } from "../constants/payoutStatuses.js";
import Contribution from "../models/Contribution.js";
import Cycle from "../models/Cycle.js";
import Group from "../models/Group.js";
import Payment from "../models/Payment.js";
import Payout from "../models/Payout.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const flag = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });

const hasStatus = (status) => ({ $eq: ["$status", status] });

const contributionAccumulators = (now) => {
  const overdueCondition = { $lte: ["$lateAfter", now] };

  return {
    paid: flag(hasStatus(CONTRIBUTION_STATUSES.PAID)),
    onTime: flag({
      $and: [
        hasStatus(CONTRIBUTION_STATUSES.PAID),
        { $eq: ["$isLate", false] },
      ],
    }),
    late: flag({
      $and: [hasStatus(CONTRIBUTION_STATUSES.PAID), { $eq: ["$isLate", true] }],
    }),
    waived: flag(hasStatus(CONTRIBUTION_STATUSES.WAIVED)),
    pending: flag(hasStatus(CONTRIBUTION_STATUSES.PENDING)),
    overdue: flag({
      $and: [hasStatus(CONTRIBUTION_STATUSES.PENDING), overdueCondition],
    }),
    totalPaid: { $sum: "$amountPaid" },
    outstanding: {
      $sum: {
        $cond: [
          hasStatus(CONTRIBUTION_STATUSES.PENDING),
          {
            $add: [
              "$amount",
              { $cond: [overdueCondition, "$latePenaltyAmount", 0] },
            ],
          },
          0,
        ],
      },
    },
  };
};

export const platformCounts = async (now = new Date()) => {
  const [
    users,
    groups,
    money,
    paymentsNeedingReview,
    pendingPayouts,
    overdueContributions,
    cyclesAwaitingDraw,
  ] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: { role: "$role", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]).exec(),
    Group.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
    Transaction.aggregate([
      {
        $group: {
          _id: "$direction",
          total: { $sum: "$amount" },
          penalties: { $sum: "$penaltyAmount" },
        },
      },
    ]).exec(),
    Payment.countDocuments({ requiresReview: true }).exec(),
    Payout.countDocuments({ status: PAYOUT_STATUSES.PENDING }).exec(),
    Contribution.countDocuments({
      status: CONTRIBUTION_STATUSES.PENDING,
      lateAfter: { $lte: now },
    }).exec(),
    Cycle.countDocuments({
      status: CYCLE_STATUSES.COLLECTED,
      recipient: null,
    }).exec(),
  ]);

  return {
    users,
    groups,
    money,
    paymentsNeedingReview,
    pendingPayouts,
    overdueContributions,
    cyclesAwaitingDraw,
  };
};

export const contributionStatsByUser = (userId, now = new Date()) =>
  Contribution.aggregate([
    { $match: { user: toObjectId(userId) } },
    { $group: { _id: null, ...contributionAccumulators(now) } },
  ]).exec();

export const contributionStatsByGroup = (groupId, now = new Date()) =>
  Contribution.aggregate([
    { $match: { group: toObjectId(groupId) } },
    { $group: { _id: null, ...contributionAccumulators(now) } },
  ]).exec();

export const contributionStatsByMembers = (groupId, now = new Date()) =>
  Contribution.aggregate([
    { $match: { group: toObjectId(groupId) } },
    { $group: { _id: "$user", ...contributionAccumulators(now) } },
  ]).exec();

export const transactionTotalsByUser = (userId) =>
  Transaction.aggregate([
    { $match: { user: toObjectId(userId) } },
    {
      $group: {
        _id: "$direction",
        total: { $sum: "$amount" },
        penalties: { $sum: "$penaltyAmount" },
        count: { $sum: 1 },
      },
    },
  ]).exec();

export const findPayoutsByGroup = (groupId) =>
  Payout.find({ group: groupId })
    .populate({ path: "user", select: "fullName" })
    .lean()
    .exec();

export const findUserNames = (userIds) =>
  User.find({ _id: { $in: userIds } })
    .select("fullName")
    .lean()
    .exec();
