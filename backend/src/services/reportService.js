import { MEMBER_STATUSES } from "../constants/memberStatuses.js";
import { TRANSACTION_DIRECTIONS } from "../constants/transactionTypes.js";
import * as cycleRepository from "../repositories/cycleRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import * as reportRepository from "../repositories/reportRepository.js";
import * as transactionRepository from "../repositories/transactionRepository.js";
import ApiError from "../utils/apiError.js";
import { canManage, requireAccess } from "./groupService.js";

const EMPTY_STATS = Object.freeze({
  paid: 0,
  onTime: 0,
  late: 0,
  waived: 0,
  pending: 0,
  overdue: 0,
  totalPaid: 0,
  outstanding: 0,
});

const STAT_KEYS = Object.keys(EMPTY_STATS);

const normalizeStats = (row) => {
  const stats = { ...EMPTY_STATS };

  if (row) {
    STAT_KEYS.forEach((key) => {
      stats[key] = row[key] ?? 0;
    });
  }

  return stats;
};

const onTimeRate = (stats) => {
  const due = stats.paid + stats.overdue;

  return due > 0 ? Math.round((stats.onTime / due) * 100) : null;
};

const totalFor = (rows, direction, field) =>
  rows.find((row) => row._id === direction)?.[field] ?? 0;

export const getGroupStatement = async (actor, groupId) => {
  const { group } = await requireAccess(actor, groupId);

  const [cycles, payouts, ledgerRows, statRows] = await Promise.all([
    cycleRepository.findByGroup(groupId),
    reportRepository.findPayoutsByGroup(groupId),
    transactionRepository.summarizeByGroup(groupId),
    reportRepository.contributionStatsByGroup(groupId),
  ]);

  const stats = normalizeStats(statRows[0]);
  const totalIn = totalFor(ledgerRows, TRANSACTION_DIRECTIONS.IN, "total");
  const totalOut = totalFor(ledgerRows, TRANSACTION_DIRECTIONS.OUT, "total");
  const payoutByCycle = new Map(
    payouts.map((payout) => [String(payout.cycle), payout]),
  );

  return {
    group: {
      id: String(group._id),
      name: group.name,
      status: group.status,
      contributionAmount: group.contributionAmount,
      frequency: group.frequency,
      memberCount: group.memberCount,
      maxMembers: group.maxMembers,
      startDate: group.startDate,
      potAmount: group.potAmount,
    },
    totals: {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      penaltiesCollected: totalFor(
        ledgerRows,
        TRANSACTION_DIRECTIONS.IN,
        "penalties",
      ),
      contributionsPaid: stats.paid,
      contributionsWaived: stats.waived,
      contributionsPending: stats.pending,
      contributionsOverdue: stats.overdue,
      latePayments: stats.late,
    },
    cycles: cycles.map((cycle) => {
      const payout = payoutByCycle.get(String(cycle._id));

      return {
        id: String(cycle._id),
        number: cycle.number,
        dueDate: cycle.dueDate,
        status: cycle.status,
        expectedCount: cycle.expectedCount,
        resolvedCount: cycle.resolvedCount,
        potAmount: cycle.potAmount,
        collectedAmount: cycle.collectedAmount,
        collectedAt: cycle.collectedAt ?? null,
        completedAt: cycle.completedAt ?? null,
        payout: payout
          ? {
              id: String(payout._id),
              amount: payout.amount,
              status: payout.status,
              paidAt: payout.paidAt ?? null,
              recipient: {
                id: payout.user ? String(payout.user._id) : null,
                fullName: payout.user?.fullName ?? null,
              },
            }
          : null,
      };
    }),
    generatedAt: new Date().toISOString(),
  };
};

export const getMemberReliability = async (actor, groupId) => {
  const { membership } = await requireAccess(actor, groupId);

  if (!canManage(actor, membership)) {
    throw ApiError.forbidden(
      "Only the group organizer can view member reliability",
    );
  }

  const rows = await reportRepository.contributionStatsByMembers(groupId);
  const users = await reportRepository.findUserNames(
    rows.map((row) => row._id),
  );
  const names = new Map(users.map((user) => [String(user._id), user.fullName]));

  const members = rows
    .map((row) => {
      const stats = normalizeStats(row);

      return {
        user: {
          id: String(row._id),
          fullName: names.get(String(row._id)) ?? null,
        },
        ...stats,
        onTimeRate: onTimeRate(stats),
      };
    })
    .sort((left, right) =>
      String(left.user.fullName ?? "").localeCompare(
        String(right.user.fullName ?? ""),
      ),
    );

  const total = rows.reduce(
    (sum, row) => {
      STAT_KEYS.forEach((key) => {
        sum[key] += row[key] ?? 0;
      });
      return sum;
    },
    { ...EMPTY_STATS },
  );

  return {
    members,
    summary: { ...total, onTimeRate: onTimeRate(total) },
    generatedAt: new Date().toISOString(),
  };
};

export const getMyStatement = async (actor) => {
  const [statRows, ledgerRows, memberships] = await Promise.all([
    reportRepository.contributionStatsByUser(actor.id),
    reportRepository.transactionTotalsByUser(actor.id),
    memberRepository.findByUser(actor.id, {
      statuses: [MEMBER_STATUSES.ACTIVE],
    }),
  ]);

  const stats = normalizeStats(statRows[0]);
  const totalContributed = totalFor(
    ledgerRows,
    TRANSACTION_DIRECTIONS.IN,
    "total",
  );
  const totalReceived = totalFor(
    ledgerRows,
    TRANSACTION_DIRECTIONS.OUT,
    "total",
  );

  return {
    activeGroups: memberships.length,
    contributions: { ...stats, onTimeRate: onTimeRate(stats) },
    ledger: {
      totalContributed,
      penaltiesPaid: totalFor(
        ledgerRows,
        TRANSACTION_DIRECTIONS.IN,
        "penalties",
      ),
      totalReceived,
      netPosition: totalReceived - totalContributed,
    },
    generatedAt: new Date().toISOString(),
  };
};
