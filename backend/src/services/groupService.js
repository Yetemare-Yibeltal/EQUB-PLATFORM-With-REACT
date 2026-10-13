import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import { MEMBER_ROLES } from "../constants/memberRoles.js";
import { MEMBER_STATUSES } from "../constants/memberStatuses.js";
import { USER_ROLES } from "../constants/roles.js";
import * as groupRepository from "../repositories/groupRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import ApiError from "../utils/apiError.js";
import generateInviteCode, {
  normalizeInviteCode,
} from "../utils/generateInviteCode.js";
import {
  buildPaginationMeta,
  parsePagination,
  parseSort,
} from "../utils/pagination.js";
import withTransaction from "../utils/transaction.js";

const SORTABLE_FIELDS = [
  "createdAt",
  "name",
  "startDate",
  "contributionAmount",
];
const MAX_INVITE_CODE_ATTEMPTS = 5;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isDuplicateInviteCode = (error) =>
  error?.code === 11000 &&
  Boolean(error.keyPattern?.inviteCode ?? error.keyValue?.inviteCode);

export const canManage = (actor, membership) =>
  actor.role === USER_ROLES.ADMIN ||
  (membership?.status === MEMBER_STATUSES.ACTIVE &&
    membership.role === MEMBER_ROLES.ORGANIZER);

export const summarizeMembership = (membership) =>
  membership
    ? {
        id: String(membership._id),
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt ?? null,
        payoutPosition: membership.payoutPosition ?? null,
        hasReceivedPayout: membership.hasReceivedPayout,
      }
    : null;

export const presentGroup = (group, { membership = null, actor }) => {
  const data = group.toJSON();

  if (!canManage(actor, membership)) {
    delete data.inviteCode;
  }

  data.membership = summarizeMembership(membership);

  return data;
};

export const loadGroup = async (groupId) => {
  const group = await groupRepository.findById(groupId);

  if (!group) {
    throw ApiError.notFound("Group not found");
  }

  return group;
};

export const requireAccess = async (
  actor,
  groupId,
  { organizerOnly = false } = {},
) => {
  const group = await loadGroup(groupId);
  const membership = await memberRepository.findByGroupAndUser(
    groupId,
    actor.id,
  );

  const isActive = membership?.status === MEMBER_STATUSES.ACTIVE;
  const isOrganizer = isActive && membership.role === MEMBER_ROLES.ORGANIZER;
  const isAdmin = actor.role === USER_ROLES.ADMIN;

  if (organizerOnly) {
    if (isOrganizer) return { group, membership };
    if (isActive)
      throw ApiError.forbidden(
        "Only the group organizer can perform this action",
      );
    throw ApiError.notFound("Group not found");
  }

  if (isActive || isAdmin) return { group, membership };

  if (membership?.status === MEMBER_STATUSES.PENDING) {
    throw ApiError.forbidden("Your membership request is awaiting approval");
  }

  throw ApiError.notFound("Group not found");
};

export const createGroup = async (actor, payload) => {
  for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
    try {
      const { group, membership } = await withTransaction(async (session) => {
        const createdGroup = await groupRepository.create(
          {
            ...payload,
            inviteCode: generateInviteCode(),
            createdBy: actor.id,
            memberCount: 1,
            status: GROUP_STATUSES.OPEN,
          },
          { session },
        );

        const createdMembership = await memberRepository.create(
          {
            group: createdGroup._id,
            user: actor.id,
            role: MEMBER_ROLES.ORGANIZER,
            status: MEMBER_STATUSES.ACTIVE,
            joinedAt: new Date(),
          },
          { session },
        );

        return { group: createdGroup, membership: createdMembership };
      });

      return presentGroup(group, { membership, actor });
    } catch (error) {
      if (isDuplicateInviteCode(error)) continue;
      throw error;
    }
  }

  throw ApiError.internal(
    "Could not generate a unique invite code, please try again",
  );
};

export const listMyGroups = async (actor, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const statuses = query.membershipStatus
    ? [query.membershipStatus]
    : [MEMBER_STATUSES.ACTIVE, MEMBER_STATUSES.PENDING];

  const memberships = await memberRepository.findByUser(actor.id, {
    statuses,
    role: query.role,
  });

  if (memberships.length === 0) {
    return { items: [], meta: buildPaginationMeta({ total: 0, page, limit }) };
  }

  const membershipByGroup = new Map(
    memberships.map((membership) => [String(membership.group), membership]),
  );

  const filter = { _id: { $in: [...membershipByGroup.keys()] } };

  if (query.status) filter.status = query.status;
  if (query.search) filter.name = new RegExp(escapeRegex(query.search), "i");

  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-createdAt");
  const { items, meta } = await groupRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
  });

  return {
    items: items.map((group) =>
      presentGroup(group, {
        membership: membershipByGroup.get(String(group._id)),
        actor,
      }),
    ),
    meta,
  };
};

export const getGroup = async (actor, groupId) => {
  const { group, membership } = await requireAccess(actor, groupId);

  return presentGroup(group, { membership, actor });
};

export const previewGroup = async (rawInviteCode) => {
  const group = await groupRepository.findByInviteCode(
    normalizeInviteCode(rawInviteCode),
    {
      populate: { path: "createdBy", select: "fullName" },
    },
  );

  if (!group) {
    throw ApiError.notFound("Invalid invite code");
  }

  return {
    name: group.name,
    description: group.description,
    contributionAmount: group.contributionAmount,
    frequency: group.frequency,
    maxMembers: group.maxMembers,
    memberCount: group.memberCount,
    spotsLeft: group.spotsLeft,
    startDate: group.startDate,
    status: group.status,
    requireApproval: group.requireApproval,
    latePenaltyAmount: group.latePenaltyAmount,
    gracePeriodDays: group.gracePeriodDays,
    payoutOrderMethod: group.payoutOrderMethod,
    organizer: { fullName: group.createdBy?.fullName ?? null },
    canJoin: group.status === GROUP_STATUSES.OPEN && !group.isFull,
  };
};

export const updateGroup = async (actor, groupId, payload) => {
  const { group, membership } = await requireAccess(actor, groupId, {
    organizerOnly: true,
  });

  if (group.status !== GROUP_STATUSES.OPEN) {
    throw ApiError.conflict("Only open groups can be edited");
  }

  const touchesLockedFields = ["contributionAmount", "frequency"].some(
    (field) => payload[field] !== undefined && payload[field] !== group[field],
  );

  if (touchesLockedFields && group.memberCount > 1) {
    throw ApiError.conflict(
      "Contribution amount and frequency cannot change after other members have joined",
    );
  }

  if (
    payload.maxMembers !== undefined &&
    payload.maxMembers < group.memberCount
  ) {
    throw ApiError.badRequest(
      "Maximum members cannot be lower than the current member count",
      [
        {
          field: "maxMembers",
          message:
            "Maximum members cannot be lower than the current member count",
        },
      ],
    );
  }

  const effectiveContribution =
    payload.contributionAmount ?? group.contributionAmount;
  const effectivePenalty = payload.latePenaltyAmount ?? group.latePenaltyAmount;

  if (effectivePenalty > effectiveContribution) {
    throw ApiError.badRequest(
      "Late penalty cannot exceed the contribution amount",
      [
        {
          field: "latePenaltyAmount",
          message: "Late penalty cannot exceed the contribution amount",
        },
      ],
    );
  }

  const conditions = [];
  if (touchesLockedFields) conditions.push({ memberCount: { $lte: 1 } });
  if (payload.maxMembers !== undefined)
    conditions.push({ memberCount: { $lte: payload.maxMembers } });

  const updated = await groupRepository.updateOpenGroup(
    groupId,
    { $set: payload },
    { filter: conditions.length > 0 ? { $and: conditions } : {} },
  );

  if (!updated) {
    throw ApiError.conflict(
      "Group could not be updated because its membership changed, please try again",
    );
  }

  return presentGroup(updated, { membership, actor });
};

export const cancelGroup = async (actor, groupId, reason) => {
  const { group, membership } = await requireAccess(actor, groupId, {
    organizerOnly: true,
  });

  if (group.status !== GROUP_STATUSES.OPEN) {
    throw ApiError.conflict("Only open groups can be cancelled");
  }

  const cancelled = await withTransaction(async (session) => {
    const updated = await groupRepository.updateOpenGroup(
      groupId,
      {
        $set: {
          status: GROUP_STATUSES.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason ?? "",
        },
      },
      { session },
    );

    if (!updated) {
      throw ApiError.conflict("Group can no longer be cancelled");
    }

    await memberRepository.rejectPendingByGroup(groupId, { session });

    return updated;
  });

  return presentGroup(cancelled, { membership, actor });
};

export const regenerateInviteCode = async (actor, groupId) => {
  const { group } = await requireAccess(actor, groupId, {
    organizerOnly: true,
  });

  if (group.status !== GROUP_STATUSES.OPEN) {
    throw ApiError.conflict(
      "Invite codes can only be changed while the group is open",
    );
  }

  for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
    try {
      const updated = await groupRepository.updateOpenGroup(groupId, {
        $set: { inviteCode: generateInviteCode() },
      });

      if (!updated) {
        throw ApiError.conflict("Group is no longer open");
      }

      return { inviteCode: updated.inviteCode };
    } catch (error) {
      if (isDuplicateInviteCode(error)) continue;
      throw error;
    }
  }

  throw ApiError.internal(
    "Could not generate a unique invite code, please try again",
  );
};
