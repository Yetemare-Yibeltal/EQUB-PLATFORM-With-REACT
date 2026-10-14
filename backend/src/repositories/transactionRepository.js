import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import { paginate } from "../utils/pagination.js";

export const create = async (data, { session } = {}) => {
  const [transaction] = await Transaction.create([data], { session });
  return transaction;
};

export const summarizeByGroup = (groupId) =>
  Transaction.aggregate([
    { $match: { group: new mongoose.Types.ObjectId(groupId) } },
    {
      $group: {
        _id: "$direction",
        total: { $sum: "$amount" },
        penalties: { $sum: "$penaltyAmount" },
        count: { $sum: 1 },
      },
    },
  ]).exec();

export const list = (filter, options) => paginate(Transaction, filter, options);
