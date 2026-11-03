import * as paymentProofRepository from "../repositories/paymentProofRepository.js";
import { parsePagination, parseSort } from "../utils/pagination.js";

const POPULATE = [
  { path: "user", select: "fullName avatarUrl" },
  { path: "group", select: "name" },
  { path: "cycle", select: "number dueDate" },
  {
    path: "contribution",
    select: "amount latePenaltyAmount lateAfter status",
  },
];

export const listAllProofs = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const sort = parseSort(query.sort, ["createdAt"], "-createdAt");

  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.groupId) filter.group = query.groupId;

  const { items, meta } = await paymentProofRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: POPULATE,
  });

  return { items: items.map((item) => item.toJSON()), meta };
};
