import Notification from "../models/Notification.js";
import { paginate } from "../utils/pagination.js";

export const createIfAbsent = async (data) => {
  try {
    return await Notification.create(data);
  } catch (error) {
    if (error?.code === 11000) return null;
    throw error;
  }
};

export const list = (filter, options) =>
  paginate(Notification, filter, options);

export const countUnread = (userId) =>
  Notification.countDocuments({ user: userId, readAt: null }).exec();

export const findOwned = (userId, id) =>
  Notification.findOne({ _id: id, user: userId }).exec();

export const markRead = (userId, id) =>
  Notification.findOneAndUpdate(
    { _id: id, user: userId, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true },
  ).exec();

export const markAllRead = (userId) =>
  Notification.updateMany(
    { user: userId, readAt: null },
    { $set: { readAt: new Date() } },
  ).exec();

export const deleteOwned = (userId, id) =>
  Notification.findOneAndDelete({ _id: id, user: userId }).exec();

export const purge = ({ readBefore, createdBefore }) =>
  Notification.deleteMany({
    $or: [
      { readAt: { $ne: null, $lte: readBefore } },
      { createdAt: { $lte: createdBefore } },
    ],
  }).exec();
