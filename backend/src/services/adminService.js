import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import { USER_ROLES } from "../constants/roles.js";
import { TRANSACTION_DIRECTIONS } from "../constants/transactionTypes.js";
import { USER_STATUSES } from "../constants/userStatuses.js";
import { listJobs as listScheduledJobs, runJobNow } from "../jobs/scheduler.js";
import * as groupRepository from "../repositories/groupRepository.js";
import * as paymentRepository from "../repositories/paymentRepository.js";
import * as reportRepository from "../repositories/reportRepository.js";
import ApiError from "../utils/apiError.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import withTransaction from "../utils/transaction.js";
import * as auditService from "./auditService.js";

const SORTABLE_FIELDS = ["createdAt", "name", "startDate", "memberCount"];
const REVIEW_NOTE_LIMIT = 500;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getOverview = async () => {
  const counts = await reportRepository.platformCounts();

  const userCount = (predicate) =>
    counts.users
      .filter((row) => predicate(row._id))
      .reduce((sum, row) => sum + row.count, 0);

  const groupCount = (status) =>
    counts.groups.find((row) => row._id === status)?.count ?? 0;

  const moneyFor = (direction, field) =>
    counts.money.find((row) => row._id === direction)?.[field] ?? 0;

  const totalIn = moneyFor(TRANSACTION_DIRECTIONS.IN, "total");
  const totalOut = moneyFor(TRANSACTION_DIRECTIONS.OUT, "total");

  return {
    users: {
      total: userCount(() => true),
      active: userCount((key) => key.status === USER_STATUSES.ACTIVE),
      suspended: userCount((key) => key.status === USER_STATUSES.SUSPENDED),
      admins: userCount((key) => key.role === USER_ROLES.ADMIN),
    },
    groups: {
      total: counts.groups.reduce((sum, row) => sum + row.count, 0),
      open: groupCount(GROUP_STATUSES.OPEN),
      active: groupCount(GROUP_STATUSES.ACTIVE),
      completed: groupCount(GROUP_STATUSES.COMPLETED),
      cancelled: groupCount(GROUP_STATUSES.CANCELLED),
    },
    money: {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      penaltiesCollected: moneyFor(TRANSACTION_DIRECTIONS.IN, "penalties"),
    },
    attention: {
      paymentsNeedingReview: counts.paymentsNeedingReview,
      pendingPayouts: counts.pendingPayouts,
      overdueContributions: counts.overdueContributions,
      cyclesAwaitingDraw: counts.cyclesAwaitingDraw,
    },
    generatedAt: new Date().toISOString(),
  };
};

export const listGroups = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 25 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-createdAt");

  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.search) filter.name = new RegExp(escapeRegex(query.search), "i");

  const { items, meta } = await groupRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: { path: "createdBy", select: "fullName" },
  });

  return {
    items: items.map((group) => {
      const data = group.toJSON();
      delete data.inviteCode;
      return data;
    }),
    meta,
  };
};

export const resolvePaymentReview = async (actor, paymentId, note) => {
  const payment = await paymentRepository.findById(paymentId);

  if (!payment) {
    throw ApiError.notFound("Payment not found");
  }

  if (!payment.requiresReview) {
    throw ApiError.conflict("This payment is not awaiting review");
  }

  const previous = payment.reviewNote
    ? ` | Previous: ${payment.reviewNote}`
    : "";
  const reviewNote = `Resolved: ${note}${previous}`.slice(0, REVIEW_NOTE_LIMIT);

  const resolved = await withTransaction(async (session) => {
    const updated = await paymentRepository.resolveReview(
      paymentId,
      reviewNote,
      { session },
    );

    if (!updated) {
      throw ApiError.conflict("This payment is not awaiting review");
    }

    await auditService.record(
      {
        actorId: actor.id,
        action: AUDIT_ACTIONS.PAYMENT_REVIEW_RESOLVED,
        groupId: updated.group,
        cycleId: updated.cycle,
        entityType: "Payment",
        entityId: updated._id,
        metadata: {
          note,
          txRef: updated.txRef,
          amount: updated.amount,
          paymentStatus: updated.status,
        },
      },
      { session },
    );

    return updated;
  });

  return resolved.toJSON();
};

export const listJobs = () => listScheduledJobs();

export const runJob = async (actor, name) => {
  const summary = (await runJobNow(name)) ?? {};

  await auditService.record({
    actorId: actor.id,
    action: AUDIT_ACTIONS.JOB_RUN,
    entityType: "Job",
    metadata: { name, summary },
  });

  return { job: name, summary };
};
