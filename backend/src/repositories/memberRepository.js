import { MEMBER_STATUSES } from "../constants/memberStatuses.js";
import Member from "../models/Member.js";
import { paginate } from "../utils/pagination.js";

export const create = async (data, { session } = {}) => {
  const [member] = await Member.create([data], { session });
  return member;
};

export const findById = (id, { session } = {}) =>
  Member.findById(id)
    .session(session || null)
    .exec();

export const findByGroupAndUser = (groupId, userId, { session } = {}) =>
  Member.findOne({ group: groupId, user: userId })
    .session(session || null)
    .exec();

export const findByUser = (userId, { statuses, role } = {}) => {
  const filter = { user: userId };

  if (statuses && statuses.length > 0) filter.status = { $in: statuses };
  if (role) filter.role = role;

  return Member.find(filter).exec();
};

export const listActiveByGroup = (groupId, { session } = {}) =>
  Member.find({ group: groupId, status: MEMBER_STATUSES.ACTIVE })
    .sort({ joinedAt: 1, _id: 1 })
    .session(session || null)
    .exec();

export const findEligibleRecipients = (groupId, { session } = {}) =>
  Member.find({
    group: groupId,
    status: MEMBER_STATUSES.ACTIVE,
    hasReceivedPayout: false,
  })
    .sort({ joinedAt: 1, _id: 1 })
    .session(session || null)
    .exec();

export const assignPayoutPosition = (id, position, { session } = {}) =>
  Member.findOneAndUpdate(
    {
      _id: id,
      status: MEMBER_STATUSES.ACTIVE,
      hasReceivedPayout: false,
      payoutPosition: null,
    },
    { $set: { payoutPosition: position } },
    { new: true, session },
  ).exec();

export const markPayoutReceived = (id, { session } = {}) =>
  Member.findOneAndUpdate(
    { _id: id, status: MEMBER_STATUSES.ACTIVE, hasReceivedPayout: false },
    { $set: { hasReceivedPayout: true } },
    { new: true, session },
  ).exec();

export const transitionStatus = (id, fromStatuses, update, { session } = {}) =>
  Member.findOneAndUpdate({ _id: id, status: { $in: fromStatuses } }, update, {
    new: true,
    runValidators: true,
    session,
  }).exec();

export const rejectPendingByGroup = (groupId, { session } = {}) =>
  Member.updateMany(
    { group: groupId, status: MEMBER_STATUSES.PENDING },
    { $set: { status: MEMBER_STATUSES.REJECTED, reviewedAt: new Date() } },
    { session },
  ).exec();

export const listByGroup = (filter, options) =>
  paginate(Member, filter, options);
