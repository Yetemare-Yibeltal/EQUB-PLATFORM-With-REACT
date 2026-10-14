import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import Group from "../models/Group.js";
import { paginate } from "../utils/pagination.js";

export const create = async (data, { session } = {}) => {
  const [group] = await Group.create([data], { session });
  return group;
};

export const findById = (id, { session } = {}) =>
  Group.findById(id)
    .session(session || null)
    .exec();

export const findByInviteCode = (inviteCode, { populate } = {}) => {
  let query = Group.findOne({ inviteCode });
  if (populate) query = query.populate(populate);
  return query.exec();
};

export const updateOpenGroup = (id, update, { filter = {}, session } = {}) =>
  Group.findOneAndUpdate(
    { _id: id, status: GROUP_STATUSES.OPEN, ...filter },
    update,
    {
      new: true,
      runValidators: true,
      session,
    },
  ).exec();

export const activate = (id, memberCount, { session } = {}) =>
  Group.findOneAndUpdate(
    { _id: id, status: GROUP_STATUSES.OPEN, memberCount },
    { $set: { status: GROUP_STATUSES.ACTIVE, maxMembers: memberCount } },
    { new: true, runValidators: true, session },
  ).exec();

export const incrementMemberCount = (id, { session } = {}) =>
  Group.findOneAndUpdate(
    {
      _id: id,
      status: GROUP_STATUSES.OPEN,
      $expr: { $lt: ["$memberCount", "$maxMembers"] },
    },
    { $inc: { memberCount: 1 } },
    { new: true, session },
  ).exec();

export const decrementMemberCount = (id, { session } = {}) =>
  Group.findOneAndUpdate(
    { _id: id, status: GROUP_STATUSES.OPEN, memberCount: { $gt: 0 } },
    { $inc: { memberCount: -1 } },
    { new: true, session },
  ).exec();

export const list = (filter, options) => paginate(Group, filter, options);
