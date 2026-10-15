import AuditLog from "../models/AuditLog.js";
import { paginate } from "../utils/pagination.js";

export const create = async (data, { session } = {}) => {
  const [entry] = await AuditLog.create([data], { session });
  return entry;
};

export const list = (filter, options) => paginate(AuditLog, filter, options);
