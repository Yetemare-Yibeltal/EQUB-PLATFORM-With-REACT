import * as transactionRepository from "../repositories/transactionRepository.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import { requireAccess } from "./groupService.js";

const SORTABLE_FIELDS = ["occurredAt", "createdAt", "amount"];
const USER_FIELDS = "fullName avatarUrl";
const OWN_POPULATE = [
  { path: "group", select: "name" },
  { path: "cycle", select: "number dueDate" },
];

export const listGroupTransactions = async (actor, groupId, query = {}) => {
  await requireAccess(actor, groupId);

  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-occurredAt");

  const filter = { group: groupId };

  if (query.type) filter.type = query.type;
  if (query.direction) filter.direction = query.direction;
  if (query.cycleId) filter.cycle = query.cycleId;
  if (query.userId) filter.user = query.userId;

  const { items, meta } = await transactionRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: { path: "user", select: USER_FIELDS },
  });

  return { items: items.map((item) => item.toJSON()), meta };
};

export const getGroupSummary = async (actor, groupId) => {
  await requireAccess(actor, groupId);

  const rows = await transactionRepository.summarizeByGroup(groupId);

  const incoming = rows.find((row) => row._id === "in");
  const outgoing = rows.find((row) => row._id === "out");

  const totalIn = incoming?.total ?? 0;
  const totalOut = outgoing?.total ?? 0;

  return {
    totalIn,
    totalOut,
    balance: totalIn - totalOut,
    penaltiesCollected: incoming?.penalties ?? 0,
    entryCount: rows.reduce((sum, row) => sum + row.count, 0),
  };
};

export const listMyTransactions = async (actor, query = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-occurredAt");

  const filter = { user: actor.id };

  if (query.type) filter.type = query.type;
  if (query.groupId) filter.group = query.groupId;

  const { items, meta } = await transactionRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: OWN_POPULATE,
  });

  return { items: items.map((item) => item.toJSON()), meta };
};
