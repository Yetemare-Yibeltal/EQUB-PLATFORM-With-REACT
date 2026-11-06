import * as auditLogRepository from "../repositories/auditLogRepository.js";
import * as userNameRepository from "../repositories/userNameRepository.js";
import ApiError from "../utils/apiError.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import { canManage, requireAccess } from "./groupService.js";

const SORTABLE_FIELDS = ["createdAt"];
const ACTOR_POPULATE = { path: "actor", select: "fullName" };
const OBJECT_ID = /^[a-f0-9]{24}$/;

export const record = (
  { actorId, action, groupId, cycleId, entityType, entityId, metadata = {} },
  { session } = {},
) =>
  auditLogRepository.create(
    {
      actor: actorId,
      action,
      group: groupId,
      cycle: cycleId,
      entityType,
      entityId,
      metadata,
    },
    { session },
  );

const subjectIdOf = (entry) => {
  const data = entry.metadata ?? {};
  const id =
    data.member ??
    data.recipientUser ??
    data.winnerUser ??
    (entry.entityType === "User" ? entry.entityId : null);
  const text = id ? String(id) : "";

  return OBJECT_ID.test(text) ? text : null;
};

const search = async (query, groupId) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-createdAt");

  const filter = {};

  if (groupId) filter.group = groupId;
  if (query.actorId) filter.actor = query.actorId;
  if (query.action) filter.action = query.action;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.entityId) filter.entityId = query.entityId;

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const { items, meta } = await auditLogRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: ACTOR_POPULATE,
  });

  const entries = items.map((item) => item.toJSON());
  const names = await userNameRepository.findNamesByIds([
    ...new Set(entries.map(subjectIdOf).filter(Boolean)),
  ]);

  return {
    items: entries.map((entry) => ({
      ...entry,
      subjectName: names.get(subjectIdOf(entry)) ?? null,
    })),
    meta,
  };
};

export const listLogs = (query = {}) => search(query, query.groupId);

export const listGroupLogs = async (actor, groupId, query = {}) => {
  const { membership } = await requireAccess(actor, groupId);

  if (!canManage(actor, membership)) {
    throw ApiError.forbidden(
      "Only the group organizer can view the audit trail",
    );
  }

  return search(query, groupId);
};
