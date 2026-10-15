import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";
import * as contributionRepository from "../repositories/contributionRepository.js";
import * as cycleRepository from "../repositories/cycleRepository.js";
import * as notificationRepository from "../repositories/notificationRepository.js";
import * as payoutRepository from "../repositories/payoutRepository.js";
import { formatDate, formatMoney } from "../utils/format.js";
import { DAY_MS, toUtcDate } from "../utils/schedule.js";
import * as notificationService from "./notificationService.js";

const REMINDER_HORIZON_DAYS = 2;
const DRAW_REMINDER_DELAY_MS = DAY_MS;
const PAYOUT_REMINDER_DELAY_MS = DAY_MS;
const READ_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 180;

const dayKey = (now) => toUtcDate(now).toISOString().slice(0, 10);

const isActiveGroup = (group) => group?.status === GROUP_STATUSES.ACTIVE;

const describeDueDate = (daysLeft, dueDate) => {
  if (daysLeft > 1)
    return `is due in ${daysLeft} days (${formatDate(dueDate)})`;
  if (daysLeft === 1) return `is due tomorrow (${formatDate(dueDate)})`;
  if (daysLeft === 0) return "is due today";
  return `was due on ${formatDate(dueDate)}`;
};

const describeConsequence = (contribution, daysLeft) => {
  if (daysLeft >= 0) return "Please pay on time.";

  return contribution.latePenaltyAmount > 0
    ? `A late penalty of ${formatMoney(contribution.latePenaltyAmount)} applies from ${formatDate(contribution.lateAfter)}.`
    : "Please pay as soon as possible.";
};

export const sendContributionReminders = async (now = new Date()) => {
  const today = toUtcDate(now);
  const horizon = new Date(today.getTime() + REMINDER_HORIZON_DAYS * DAY_MS);
  const contributions = await contributionRepository.findDueSoon({
    now,
    horizon,
  });

  let sent = 0;

  for (const contribution of contributions) {
    if (!isActiveGroup(contribution.group) || !contribution.cycle) continue;

    const daysLeft = Math.round(
      (toUtcDate(contribution.dueDate).getTime() - today.getTime()) / DAY_MS,
    );

    const notification = await notificationService.send({
      userId: contribution.user,
      type: NOTIFICATION_TYPES.CONTRIBUTION_REMINDER,
      title: "Contribution reminder",
      message: `Your contribution of ${formatMoney(contribution.amount)} to ${contribution.group.name} ${describeDueDate(daysLeft, contribution.dueDate)}. ${describeConsequence(contribution, daysLeft)}`,
      groupId: contribution.group._id,
      cycleId: contribution.cycle._id,
      entityType: "Contribution",
      entityId: contribution._id,
      data: {
        dueDate: contribution.dueDate,
        daysLeft,
        amount: contribution.amount,
      },
      dedupeKey: `contribution-reminder:${contribution._id}:d${daysLeft}`,
    });

    if (notification) sent += 1;
  }

  return sent;
};

export const sendOverdueNotices = async (now = new Date()) => {
  const contributions = await contributionRepository.findOverdue({ now });
  const perCycle = new Map();

  let sent = 0;

  for (const contribution of contributions) {
    if (!isActiveGroup(contribution.group) || !contribution.cycle) continue;

    const owed = contribution.amount + contribution.latePenaltyAmount;

    const notification = await notificationService.send({
      userId: contribution.user,
      type: NOTIFICATION_TYPES.CONTRIBUTION_OVERDUE,
      title: "Contribution overdue",
      message:
        contribution.latePenaltyAmount > 0
          ? `Your contribution to ${contribution.group.name} is overdue. A late penalty of ${formatMoney(contribution.latePenaltyAmount)} was added, so you now owe ${formatMoney(owed)}.`
          : `Your contribution of ${formatMoney(contribution.amount)} to ${contribution.group.name} is overdue. Please pay as soon as possible.`,
      groupId: contribution.group._id,
      cycleId: contribution.cycle._id,
      entityType: "Contribution",
      entityId: contribution._id,
      data: {
        amount: contribution.amount,
        penalty: contribution.latePenaltyAmount,
        owed,
      },
      dedupeKey: `contribution-overdue:${contribution._id}`,
    });

    if (notification) sent += 1;

    const key = String(contribution.cycle._id);
    const entry = perCycle.get(key) ?? {
      group: contribution.group,
      cycle: contribution.cycle,
      count: 0,
    };

    entry.count += 1;
    perCycle.set(key, entry);
  }

  for (const [cycleId, entry] of perCycle) {
    const subject =
      entry.count === 1
        ? "member has an overdue contribution"
        : "members have overdue contributions";

    const notification = await notificationService.send({
      userId: entry.group.createdBy,
      type: NOTIFICATION_TYPES.OVERDUE_SUMMARY,
      title: "Overdue contributions",
      message: `${entry.count} ${subject} for cycle ${entry.cycle.number} of ${entry.group.name}.`,
      groupId: entry.group._id,
      cycleId,
      entityType: "Cycle",
      entityId: cycleId,
      data: { overdueCount: entry.count },
      dedupeKey: `overdue-summary:${cycleId}:${dayKey(now)}`,
    });

    if (notification) sent += 1;
  }

  return sent;
};

export const sendDrawReminders = async (now = new Date()) => {
  const cycles = await cycleRepository.findAwaitingDraw(
    new Date(now.getTime() - DRAW_REMINDER_DELAY_MS),
  );

  let sent = 0;

  for (const cycle of cycles) {
    if (!isActiveGroup(cycle.group)) continue;

    const notification = await notificationService.send({
      userId: cycle.group.createdBy,
      type: NOTIFICATION_TYPES.DRAW_REMINDER,
      title: "Draw is waiting",
      message: `Cycle ${cycle.number} of ${cycle.group.name} is fully collected. Perform the draw so the payout can be arranged.`,
      groupId: cycle.group._id,
      cycleId: cycle._id,
      entityType: "Cycle",
      entityId: cycle._id,
      dedupeKey: `draw-reminder:${cycle._id}:${dayKey(now)}`,
    });

    if (notification) sent += 1;
  }

  return sent;
};

export const sendPayoutReminders = async (now = new Date()) => {
  const payouts = await payoutRepository.findPendingBefore(
    new Date(now.getTime() - PAYOUT_REMINDER_DELAY_MS),
  );

  let sent = 0;

  for (const payout of payouts) {
    if (!isActiveGroup(payout.group) || !payout.cycle) continue;

    const notification = await notificationService.send({
      userId: payout.group.createdBy,
      type: NOTIFICATION_TYPES.PAYOUT_REMINDER,
      title: "Payout is pending",
      message: `The payout of ${formatMoney(payout.amount)} to ${payout.user?.fullName ?? "the winner"} for cycle ${payout.cycle.number} of ${payout.group.name} is still pending.`,
      groupId: payout.group._id,
      cycleId: payout.cycle._id,
      entityType: "Payout",
      entityId: payout._id,
      dedupeKey: `payout-reminder:${payout._id}:${dayKey(now)}`,
    });

    if (notification) sent += 1;
  }

  return sent;
};

export const purgeOldNotifications = async (now = new Date()) => {
  const result = await notificationRepository.purge({
    readBefore: new Date(now.getTime() - READ_RETENTION_DAYS * DAY_MS),
    createdBefore: new Date(now.getTime() - MAX_RETENTION_DAYS * DAY_MS),
  });

  return result.deletedCount;
};
