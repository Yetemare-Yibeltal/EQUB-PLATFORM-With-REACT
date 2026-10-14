import { CONTRIBUTION_STATUSES } from "../constants/contributionStatuses.js";
import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import {
  TRANSACTION_DIRECTIONS,
  TRANSACTION_TYPES,
} from "../constants/transactionTypes.js";
import * as contributionRepository from "../repositories/contributionRepository.js";
import * as cycleRepository from "../repositories/cycleRepository.js";
import * as transactionRepository from "../repositories/transactionRepository.js";
import ApiError from "../utils/apiError.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import withTransaction from "../utils/transaction.js";
import { requireAccess } from "./groupService.js";

const SORTABLE_FIELDS = ["dueDate", "createdAt", "paidAt", "amount"];
const USER_FIELDS = "fullName avatarUrl";
const GROUP_FIELDS = "name contributionAmount frequency status";
const CYCLE_FIELDS = "number dueDate status";

const buildStatusFilter = ({ status, overdue }) => {
  if (overdue) {
    return {
      status: CONTRIBUTION_STATUSES.PENDING,
      lateAfter: { $lte: new Date() },
    };
  }

  return status ? { status } : {};
};

const loadTarget = async (groupId, contributionId) => {
  const contribution = await contributionRepository.findById(contributionId);

  if (!contribution || String(contribution.group) !== String(groupId)) {
    throw ApiError.notFound("Contribution not found");
  }

  return contribution;
};

export const applyResolution = async (
  session,
  contributionId,
  { update, collectedAmount, ledger = null },
) => {
  const updated = await contributionRepository.transitionPending(
    contributionId,
    update,
    {
      session,
    },
  );

  if (!updated) {
    throw ApiError.conflict("This contribution has already been resolved");
  }

  const cycle = await cycleRepository.recordResolution(
    updated.cycle,
    collectedAmount,
    {
      session,
    },
  );

  if (!cycle) {
    throw ApiError.conflict("This cycle is not collecting contributions");
  }

  await cycleRepository.markCollected(updated.cycle, { session });

  if (ledger) {
    await transactionRepository.create(
      {
        group: updated.group,
        cycle: updated.cycle,
        contribution: updated._id,
        user: updated.user,
        type: TRANSACTION_TYPES.CONTRIBUTION,
        direction: TRANSACTION_DIRECTIONS.IN,
        ...ledger,
      },
      { session },
    );
  }

  return updated;
};

const resolveContribution = async (
  actor,
  groupId,
  contributionId,
  buildResolution,
) => {
  const { group } = await requireAccess(actor, groupId, {
    organizerOnly: true,
  });

  if (group.status !== GROUP_STATUSES.ACTIVE) {
    throw ApiError.conflict(
      "Contributions can only be recorded while the group is active",
    );
  }

  const target = await loadTarget(groupId, contributionId);

  if (target.status !== CONTRIBUTION_STATUSES.PENDING) {
    throw ApiError.conflict("This contribution has already been resolved");
  }

  const resolution = buildResolution(target);

  const resolved = await withTransaction((session) =>
    applyResolution(session, contributionId, resolution),
  );

  await resolved.populate({ path: "user", select: USER_FIELDS });

  return resolved.toJSON();
};

export const recordContribution = (
  actor,
  groupId,
  contributionId,
  { paymentMethod, reference, note, paidAt },
) =>
  resolveContribution(actor, groupId, contributionId, (target) => {
    const paymentTime = paidAt ? new Date(paidAt) : new Date();

    if (paymentTime.getTime() > Date.now()) {
      throw ApiError.badRequest("Payment time cannot be in the future", [
        { field: "paidAt", message: "Payment time cannot be in the future" },
      ]);
    }

    const isLate = paymentTime.getTime() >= target.lateAfter.getTime();
    const penaltyAmount = isLate ? target.latePenaltyAmount : 0;
    const amountPaid = target.amount + penaltyAmount;

    return {
      collectedAmount: amountPaid,
      update: {
        $set: {
          status: CONTRIBUTION_STATUSES.PAID,
          isLate,
          amountPaid,
          paidAt: paymentTime,
          paymentMethod,
          reference: reference ?? "",
          note: note ?? "",
          recordedBy: actor.id,
        },
      },
      ledger: {
        amount: amountPaid,
        penaltyAmount,
        method: paymentMethod,
        reference: reference ?? "",
        recordedBy: actor.id,
        occurredAt: paymentTime,
      },
    };
  });

export const waiveContribution = (actor, groupId, contributionId, reason) =>
  resolveContribution(actor, groupId, contributionId, () => ({
    collectedAmount: 0,
    update: {
      $set: {
        status: CONTRIBUTION_STATUSES.WAIVED,
        waivedBy: actor.id,
        waivedAt: new Date(),
        waiveReason: reason,
      },
    },
  }));

export const listContributions = async (actor, groupId, query = {}) => {
  await requireAccess(actor, groupId);

  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "dueDate");

  const filter = { group: groupId, ...buildStatusFilter(query) };

  if (query.cycleId) filter.cycle = query.cycleId;
  if (query.userId) filter.user = query.userId;

  const { items, meta } = await contributionRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: { path: "user", select: USER_FIELDS },
  });

  return { items: items.map((item) => item.toJSON()), meta };
};

export const listMyContributions = async (actor, query = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "dueDate");

  const filter = { user: actor.id, ...buildStatusFilter(query) };

  if (query.groupId) filter.group = query.groupId;

  const { items, meta } = await contributionRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: [
      { path: "group", select: GROUP_FIELDS },
      { path: "cycle", select: CYCLE_FIELDS },
    ],
  });

  return { items: items.map((item) => item.toJSON()), meta };
};
