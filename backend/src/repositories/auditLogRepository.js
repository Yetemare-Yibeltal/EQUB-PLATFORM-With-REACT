import AuditLog from "../models/AuditLog.js";

export const create = async (data, { session } = {}) => {
  const [entry] = await AuditLog.create([data], { session });
  return entry;
};
