import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import {
  ACTIVE_DISPUTE_STATUSES,
  DISPUTE_STATUSES,
  FINAL_DISPUTE_STATUSES,
} from "../constants/disputeStatuses.js";
import { MEMBER_ROLES } from "../constants/memberRoles.js";
import { MEMBER_STATUSES } from "../constants/memberStatuses.js";
import { USER_ROLES } from "../constants/roles.js";
import * as cycleRepository from "../repositories/cycleRepository.js";
import * as disputeRepository from "../repositories/disputeRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import ApiError from "../utils/apiError.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import * as auditService from "./auditService.js";
import * as disputeNotificationService from "./disputeNotificationService.js";
import { requireAccess } from "./groupService.js";

const MAX_ACTIVE_PER_MEMBER = 5;
const SORTABLE_FIELDS = ["createdAt", "updatedAt"];
const USER_FIELDS = "fullName avatarUrl";

const LIST_POPULATE = [
  { path: "reporter", select: USER_FIELDS },
  { path: "against", select: USER_FIELDS },
  { path: "group", select: "name" },
];

const DETAIL_POPULATE = [
  ...LIST_POPULATE,
  { path: "cycle", select: "number dueDate" },
  { path: "decidedBy", select: "fullName" },
  { path: "comments.author", select: USER_FIELDS },
];

const isSame = (a, b) => Boolean(a) && Boolean(b) && String(a) === String(b);

const activeRoleOf = async (groupId, userId) => {
  if (!userId) return null;

  const membership = await memberRepository.findByGroupAndUser(groupId, userId);

  return membership?.status === MEMBER_STATUSES.ACTIVE ? membership.role : null;
};

const loadDispute = async (disputeId, groupId) => {
  const dispute = await disputeRepository.findById(disputeId);

  if (!dispute || (groupId && String(dispute.group) !== String(groupId))) {
    throw ApiError.notFound("Dispute not found");
  }

  return dispute;
};

const buildContext = async (actor, dispute) => {
  const { membership } = await requireAccess(actor, dispute.group);

  const isAdmin = actor.role === USER_ROLES.ADMIN;
  const isOrganizer =
    membership?.status === MEMBER_STATUSES.ACTIVE &&
    membership.role === MEMBER_ROLES.ORGANIZER;
  const isParty =
    isSame(dispute.reporter, actor.id) || isSame(dispute.against, actor.id);

  if (!isAdmin && !isOrganizer && !isParty) {
    throw ApiError.notFound("Dispute not found");
  }

  const [reporterRole, againstRole] = await Promise.all([
    activeRoleOf(dispute.group, dispute.reporter),
    activeRoleOf(dispute.group, dispute.against),
  ]);

  const organizerInvolved =
    reporterRole === MEMBER_ROLES.ORGANIZER ||
    againstRole === MEMBER_ROLES.ORGANIZER;

  return {
    isAdmin,
    isOrganizer,
    organizerInvolved,
    canDecide: isAdmin || (isOrganizer && !organizerInvolved),
    isActive: ACTIVE_DISPUTE_STATUSES.includes(dispute.status),
  };
};

const present = async (dispute, context) => {
  await dispute.populate(DETAIL_POPULATE);

  return {
    ...dispute.toJSON(),
    permissions: {
      canDecide: context.canDecide && context.isActive,
      canComment: context.isActive,
    },
  };
};

const presentList = async (query, filter) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-createdAt");

  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const { items, meta } = await disputeRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: LIST_POPULATE,
  });

  return { items: items.map((item) => item.toJSON()), meta };
};

export const createDispute = async (actor, groupId, payload) => {
  const { group, membership } = await requireAccess(actor, groupId);

  if (!membership || membership.status !== MEMBER_STATUSES.ACTIVE) {
    throw ApiError.forbidden("Only group members can report a problem");
  }

  const activeCount = await disputeRepository.countActiveByReporter(
    group._id,
    actor.id,
  );

  if (activeCount >= MAX_ACTIVE_PER_MEMBER) {
    throw ApiError.conflict(
      `You already have ${MAX_ACTIVE_PER_MEMBER} open disputes in this group`,
    );
  }

  if (payload.againstUserId) {
    if (isSame(payload.againstUserId, actor.id)) {
      throw ApiError.conflict("You cannot report yourself");
    }

    const role = await activeRoleOf(group._id, payload.againstUserId);

    if (!role) {
      throw ApiError.notFound("Member not found");
    }
  }

  const cycle = await cycleRepository.findCurrent(group._id);

  const dispute = await disputeRepository.create({
    group: group._id,
    cycle: cycle?._id,
    reporter: actor.id,
    against: payload.againstUserId,
    category: payload.category,
    subject: payload.subject,
    description: payload.description,
  });

  await disputeNotificationService.notifyDisputeOpened(dispute);

  const context = await buildContext(actor, dispute);

  return present(dispute, context);
};

export const listGroupDisputes = async (actor, groupId, query = {}) => {
  const { membership } = await requireAccess(actor, groupId);

  const isAdmin = actor.role === USER_ROLES.ADMIN;
  const isOrganizer =
    membership?.status === MEMBER_STATUSES.ACTIVE &&
    membership.role === MEMBER_ROLES.ORGANIZER;

  const filter = { group: groupId };

  if (!isAdmin && !isOrganizer) {
    filter.$or = [{ reporter: actor.id }, { against: actor.id }];
  }

  return presentList(query, filter);
};

export const listAllDisputes = (query = {}) => {
  const filter = {};

  if (query.groupId) filter.group = query.groupId;

  return presentList(query, filter);
};

export const getDispute = async (actor, disputeId, { groupId } = {}) => {
  const dispute = await loadDispute(disputeId, groupId);
  const context = await buildContext(actor, dispute);

  return present(dispute, context);
};

export const addComment = async (actor, disputeId, body, { groupId } = {}) => {
  const dispute = await loadDispute(disputeId, groupId);
  const context = await buildContext(actor, dispute);

  const updated = await disputeRepository.addComment(dispute._id, {
    author: actor.id,
    body,
  });

  if (!updated) {
    throw ApiError.conflict("This dispute is already closed");
  }

  const comment = updated.comments[updated.comments.length - 1];

  await disputeNotificationService.notifyDisputeComment(
    updated,
    comment,
    actor.id,
  );

  return present(updated, { ...context, isActive: true });
};

export const decideDispute = async (
  actor,
  disputeId,
  { status, resolution = "" },
  { groupId } = {},
) => {
  const dispute = await loadDispute(disputeId, groupId);
  const context = await buildContext(actor, dispute);

  if (!context.canDecide) {
    throw ApiError.forbidden(
      context.organizerInvolved
        ? "Only an administrator can decide this dispute"
        : "Only the group organizer can decide this dispute",
    );
  }

  if (FINAL_DISPUTE_STATUSES.includes(dispute.status)) {
    throw ApiError.conflict("This dispute has already been decided");
  }

  const isFinal = FINAL_DISPUTE_STATUSES.includes(status);

  const fromStatuses = isFinal
    ? ACTIVE_DISPUTE_STATUSES
    : [DISPUTE_STATUSES.OPEN];

  const update = isFinal
    ? {
        status,
        resolution,
        decidedBy: actor.id,
        decidedAt: new Date(),
      }
    : { status };

  const updated = await disputeRepository.transition(
    dispute._id,
    fromStatuses,
    update,
  );

  if (!updated) {
    throw ApiError.conflict(
      "This dispute is no longer in a state that allows it",
    );
  }

  if (isFinal) {
    await auditService.record({
      actorId: actor.id,
      action: AUDIT_ACTIONS.DISPUTE_DECIDED,
      groupId: updated.group,
      cycleId: updated.cycle,
      entityType: "Dispute",
      entityId: updated._id,
      metadata: {
        status,
        category: updated.category,
        subject: updated.subject,
        reporter: String(updated.reporter),
        against: updated.against ? String(updated.against) : "",
      },
    });

    await disputeNotificationService.notifyDisputeDecided(updated, actor.id);
  } else {
    await disputeNotificationService.notifyDisputeInReview(updated, actor.id);
  }

  return present(updated, {
    ...context,
    isActive: !isFinal,
  });
};
