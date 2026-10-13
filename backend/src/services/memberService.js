import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import { MEMBER_ROLES } from "../constants/memberRoles.js";
import { MEMBER_STATUSES } from "../constants/memberStatuses.js";
import * as groupRepository from "../repositories/groupRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import ApiError from "../utils/apiError.js";
import { normalizeInviteCode } from "../utils/generateInviteCode.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import withTransaction from "../utils/transaction.js";
import {
  canManage,
  loadGroup,
  presentGroup,
  requireAccess,
  summarizeMembership,
} from "./groupService.js";

const SORTABLE_FIELDS = ["joinedAt", "createdAt", "payoutPosition"];
const USER_FIELDS = "fullName avatarUrl phone";

const presentMember = (member, { includePhone }) => {
  const data = member.toJSON();

  if (!includePhone && data.user && data.user.phone !== undefined) {
    delete data.user.phone;
  }

  return data;
};

const loadTarget = async (groupId, memberId) => {
  const target = await memberRepository.findById(memberId);

  if (!target || String(target.group) !== String(groupId)) {
    throw ApiError.notFound("Member not found");
  }

  return target;
};

const buildReapplyUpdate = (targetStatus, now) => {
  const set = { status: targetStatus, role: MEMBER_ROLES.MEMBER };
  const unset = {
    leftAt: "",
    removedAt: "",
    removedBy: "",
    reviewedAt: "",
    reviewedBy: "",
  };

  if (targetStatus === MEMBER_STATUSES.ACTIVE) {
    set.joinedAt = now;
  } else {
    unset.joinedAt = "";
  }

  return { $set: set, $unset: unset };
};

export const joinGroup = async (actor, rawInviteCode) => {
  const group = await groupRepository.findByInviteCode(
    normalizeInviteCode(rawInviteCode),
  );

  if (!group) {
    throw ApiError.notFound("Invalid invite code");
  }

  if (group.status !== GROUP_STATUSES.OPEN) {
    throw ApiError.conflict("This group is no longer accepting members");
  }

  if (group.isFull) {
    throw ApiError.conflict("This group is full");
  }

  const existing = await memberRepository.findByGroupAndUser(
    group._id,
    actor.id,
  );

  if (existing?.status === MEMBER_STATUSES.ACTIVE) {
    throw ApiError.conflict("You are already a member of this group");
  }

  if (existing?.status === MEMBER_STATUSES.PENDING) {
    throw ApiError.conflict(
      "Your membership request is already awaiting approval",
    );
  }

  if (existing?.status === MEMBER_STATUSES.REMOVED) {
    throw ApiError.forbidden(
      "You were removed from this group and cannot rejoin",
    );
  }

  const targetStatus = group.requireApproval
    ? MEMBER_STATUSES.PENDING
    : MEMBER_STATUSES.ACTIVE;
  const now = new Date();

  try {
    const result = await withTransaction(async (session) => {
      let currentGroup = group;

      if (targetStatus === MEMBER_STATUSES.ACTIVE) {
        currentGroup = await groupRepository.incrementMemberCount(group._id, {
          session,
        });

        if (!currentGroup) {
          throw ApiError.conflict(
            "This group is full or no longer accepting members",
          );
        }
      }

      const membership = existing
        ? await memberRepository.transitionStatus(
            existing._id,
            [MEMBER_STATUSES.LEFT, MEMBER_STATUSES.REJECTED],
            buildReapplyUpdate(targetStatus, now),
            { session },
          )
        : await memberRepository.create(
            {
              group: group._id,
              user: actor.id,
              role: MEMBER_ROLES.MEMBER,
              status: targetStatus,
              joinedAt:
                targetStatus === MEMBER_STATUSES.ACTIVE ? now : undefined,
            },
            { session },
          );

      if (!membership) {
        throw ApiError.conflict(
          "Your membership could not be updated, please try again",
        );
      }

      return { group: currentGroup, membership };
    });

    return {
      group: presentGroup(result.group, {
        membership: result.membership,
        actor,
      }),
      membership: summarizeMembership(result.membership),
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw ApiError.conflict("You are already a member of this group");
    }
    throw error;
  }
};

export const listMembers = async (actor, groupId, query = {}) => {
  const { membership } = await requireAccess(actor, groupId);
  const privileged = canManage(actor, membership);

  let statuses = [MEMBER_STATUSES.ACTIVE];

  if (privileged) {
    statuses = query.status
      ? [query.status]
      : [MEMBER_STATUSES.ACTIVE, MEMBER_STATUSES.PENDING];
  }

  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "createdAt");

  const { items, meta } = await memberRepository.listByGroup(
    { group: groupId, status: { $in: statuses } },
    {
      page,
      limit,
      skip,
      sort,
      populate: { path: "user", select: USER_FIELDS },
    },
  );

  return {
    items: items.map((member) =>
      presentMember(member, { includePhone: privileged }),
    ),
    meta,
  };
};

export const approveMember = async (actor, groupId, memberId) => {
  await requireAccess(actor, groupId, { organizerOnly: true });
  await loadTarget(groupId, memberId);

  const approved = await withTransaction(async (session) => {
    const updatedGroup = await groupRepository.incrementMemberCount(groupId, {
      session,
    });

    if (!updatedGroup) {
      throw ApiError.conflict(
        "This group is full or no longer accepting members",
      );
    }

    const now = new Date();

    const member = await memberRepository.transitionStatus(
      memberId,
      [MEMBER_STATUSES.PENDING],
      {
        $set: {
          status: MEMBER_STATUSES.ACTIVE,
          joinedAt: now,
          reviewedBy: actor.id,
          reviewedAt: now,
        },
      },
      { session },
    );

    if (!member) {
      throw ApiError.conflict("This membership request is no longer pending");
    }

    return member;
  });

  await approved.populate({ path: "user", select: USER_FIELDS });

  return presentMember(approved, { includePhone: true });
};

export const rejectMember = async (actor, groupId, memberId) => {
  await requireAccess(actor, groupId, { organizerOnly: true });
  await loadTarget(groupId, memberId);

  const rejected = await memberRepository.transitionStatus(
    memberId,
    [MEMBER_STATUSES.PENDING],
    {
      $set: {
        status: MEMBER_STATUSES.REJECTED,
        reviewedBy: actor.id,
        reviewedAt: new Date(),
      },
    },
  );

  if (!rejected) {
    throw ApiError.conflict("This membership request is no longer pending");
  }

  await rejected.populate({ path: "user", select: USER_FIELDS });

  return presentMember(rejected, { includePhone: true });
};

export const removeMember = async (actor, groupId, memberId) => {
  await requireAccess(actor, groupId, { organizerOnly: true });
  const target = await loadTarget(groupId, memberId);

  if (target.role === MEMBER_ROLES.ORGANIZER) {
    throw ApiError.badRequest("The organizer cannot be removed from the group");
  }

  await withTransaction(async (session) => {
    const removed = await memberRepository.transitionStatus(
      memberId,
      [MEMBER_STATUSES.ACTIVE],
      {
        $set: {
          status: MEMBER_STATUSES.REMOVED,
          removedAt: new Date(),
          removedBy: actor.id,
        },
      },
      { session },
    );

    if (!removed) {
      throw ApiError.conflict("This member is no longer active in the group");
    }

    const updatedGroup = await groupRepository.decrementMemberCount(groupId, {
      session,
    });

    if (!updatedGroup) {
      throw ApiError.conflict(
        "Members cannot be removed after the group has started",
      );
    }
  });
};

export const leaveGroup = async (actor, groupId) => {
  const group = await loadGroup(groupId);
  const membership = await memberRepository.findByGroupAndUser(
    groupId,
    actor.id,
  );

  const leavable = [MEMBER_STATUSES.ACTIVE, MEMBER_STATUSES.PENDING];

  if (!membership || !leavable.includes(membership.status)) {
    throw ApiError.notFound("You are not a member of this group");
  }

  if (membership.status === MEMBER_STATUSES.PENDING) {
    await memberRepository.transitionStatus(
      membership._id,
      [MEMBER_STATUSES.PENDING],
      {
        $set: { status: MEMBER_STATUSES.LEFT, leftAt: new Date() },
      },
    );
    return;
  }

  if (membership.role === MEMBER_ROLES.ORGANIZER) {
    throw ApiError.badRequest(
      "The organizer cannot leave the group, cancel the group instead",
    );
  }

  if (group.status !== GROUP_STATUSES.OPEN) {
    throw ApiError.conflict("You cannot leave a group after it has started");
  }

  await withTransaction(async (session) => {
    const left = await memberRepository.transitionStatus(
      membership._id,
      [MEMBER_STATUSES.ACTIVE],
      { $set: { status: MEMBER_STATUSES.LEFT, leftAt: new Date() } },
      { session },
    );

    if (!left) {
      throw ApiError.conflict("Your membership is no longer active");
    }

    const updatedGroup = await groupRepository.decrementMemberCount(groupId, {
      session,
    });

    if (!updatedGroup) {
      throw ApiError.conflict("You cannot leave a group after it has started");
    }
  });
};
