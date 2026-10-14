import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import { PAYOUT_STATUSES } from "../constants/payoutStatuses.js";
import {
  TRANSACTION_DIRECTIONS,
  TRANSACTION_TYPES,
} from "../constants/transactionTypes.js";
import * as contributionRepository from "../repositories/contributionRepository.js";
import * as cycleRepository from "../repositories/cycleRepository.js";
import * as groupRepository from "../repositories/groupRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import * as payoutRepository from "../repositories/payoutRepository.js";
import * as transactionRepository from "../repositories/transactionRepository.js";
import ApiError from "../utils/apiError.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import { lateThreshold } from "../utils/schedule.js";
import withTransaction from "../utils/transaction.js";
import * as auditService from "./auditService.js";
import { requireAccess } from "./groupService.js";

const SORTABLE_FIELDS = ["createdAt", "paidAt", "amount"];
const USER_FIELDS = "fullName avatarUrl";
const GROUP_VIEW_POPULATE = [
  { path: "user", select: USER_FIELDS },
  { path: "cycle", select: "number dueDate" },
];
const OWN_POPULATE = [
  { path: "group", select: "name" },
  { path: "cycle", select: "number dueDate" },
];

const loadTarget = async (groupId, payoutId) => {
  const payout = await payoutRepository.findById(payoutId);

  if (!payout || String(payout.group) !== String(groupId)) {
    throw ApiError.notFound("Payout not found");
  }

  return payout;
};

export const listGroupPayouts = async (actor, groupId, query = {}) => {
  await requireAccess(actor, groupId);

  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "createdAt");

  const filter = { group: groupId };

  if (query.status) filter.status = query.status;
  if (query.cycleId) filter.cycle = query.cycleId;

  const { items, meta } = await payoutRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: GROUP_VIEW_POPULATE,
  });

  return { items: items.map((item) => item.toJSON()), meta };
};

export const listMyPayouts = async (actor, query = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-createdAt");

  const filter = { user: actor.id };

  if (query.status) filter.status = query.status;
  if (query.groupId) filter.group = query.groupId;

  const { items, meta } = await payoutRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: OWN_POPULATE,
  });

  return { items: items.map((item) => item.toJSON()), meta };
};

export const getPayout = async (actor, groupId, payoutId) => {
  await requireAccess(actor, groupId);

  const payout = await loadTarget(groupId, payoutId);

  await payout.populate(GROUP_VIEW_POPULATE);

  return payout.toJSON();
};

export const recordPayout = async (
  actor,
  groupId,
  payoutId,
  { paymentMethod, reference, note, paidAt },
) => {
  const { group } = await requireAccess(actor, groupId, {
    organizerOnly: true,
  });

  if (group.status !== GROUP_STATUSES.ACTIVE) {
    throw ApiError.conflict(
      "Payouts can only be recorded while the group is active",
    );
  }

  const target = await loadTarget(groupId, payoutId);

  if (target.status !== PAYOUT_STATUSES.PENDING) {
    throw ApiError.conflict("This payout has already been recorded");
  }

  const paymentTime = paidAt ? new Date(paidAt) : new Date();

  if (paymentTime.getTime() > Date.now()) {
    throw ApiError.badRequest("Payment time cannot be in the future", [
      { field: "paidAt", message: "Payment time cannot be in the future" },
    ]);
  }

  const result = await withTransaction(async (session) => {
    const paid = await payoutRepository.transitionPending(
      target._id,
      {
        $set: {
          status: PAYOUT_STATUSES.PAID,
          paidAt: paymentTime,
          paymentMethod,
          reference: reference ?? "",
          note: note ?? "",
          recordedBy: actor.id,
        },
      },
      { session },
    );

    if (!paid) {
      throw ApiError.conflict("This payout has already been recorded");
    }

    const cycle = await cycleRepository.markCompleted(paid.cycle, { session });

    if (!cycle) {
      throw ApiError.conflict("This cycle is not awaiting payout");
    }

    const recipient = await memberRepository.markPayoutReceived(paid.member, {
      session,
    });

    if (!recipient) {
      throw ApiError.conflict(
        "The recipient is no longer an active member of this group",
      );
    }

    await transactionRepository.create(
      {
        group: paid.group,
        cycle: paid.cycle,
        user: paid.user,
        type: TRANSACTION_TYPES.PAYOUT,
        direction: TRANSACTION_DIRECTIONS.OUT,
        amount: paid.amount,
        method: paymentMethod,
        reference: reference ?? "",
        recordedBy: actor.id,
        occurredAt: paymentTime,
      },
      { session },
    );

    const nextCycle = await cycleRepository.activateNext(
      paid.group,
      cycle.number + 1,
      {
        session,
      },
    );

    let groupStatus = GROUP_STATUSES.ACTIVE;

    if (nextCycle) {
      const currentGroup = await groupRepository.findById(paid.group, {
        session,
      });
      const members = await memberRepository.listActiveByGroup(paid.group, {
        session,
      });

      if (members.length !== nextCycle.expectedCount) {
        throw ApiError.conflict(
          "Group membership does not match the next cycle, please contact support",
        );
      }

      await contributionRepository.createMany(
        members.map((member) => ({
          group: paid.group,
          cycle: nextCycle._id,
          member: member._id,
          user: member.user,
          amount: currentGroup.contributionAmount,
          latePenaltyAmount: currentGroup.latePenaltyAmount,
          dueDate: nextCycle.dueDate,
          lateAfter: lateThreshold(
            nextCycle.dueDate,
            currentGroup.gracePeriodDays,
          ),
        })),
        { session },
      );
    } else {
      const completed = await groupRepository.complete(paid.group, { session });

      if (!completed) {
        throw ApiError.conflict(
          "Group could not be completed, please try again",
        );
      }

      groupStatus = completed.status;
    }

    await auditService.record(
      {
        actorId: actor.id,
        action: AUDIT_ACTIONS.PAYOUT_PAID,
        groupId: paid.group,
        cycleId: paid.cycle,
        entityType: "Payout",
        entityId: paid._id,
        metadata: {
          amount: paid.amount,
          paymentMethod,
          reference: reference ?? "",
          recipientUser: String(paid.user),
          cycleNumber: cycle.number,
          groupStatus,
        },
      },
      { session },
    );

    return { payout: paid, cycle, nextCycle, groupStatus };
  });

  await result.payout.populate(GROUP_VIEW_POPULATE);

  return {
    payout: result.payout.toJSON(),
    cycle: result.cycle.toJSON(),
    nextCycle: result.nextCycle ? result.nextCycle.toJSON() : null,
    groupStatus: result.groupStatus,
  };
};
