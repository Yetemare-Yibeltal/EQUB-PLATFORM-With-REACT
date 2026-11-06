import User from "../models/User.js";

export const findNamesByIds = async (ids) => {
  if (ids.length === 0) return new Map();

  const users = await User.find({ _id: { $in: ids } })
    .select("fullName")
    .lean();

  return new Map(users.map((user) => [String(user._id), user.fullName]));
};
