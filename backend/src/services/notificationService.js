import { emitToGroup, evictUserFromGroup } from "../config/socket.js";
import { CONTRIBUTION_STATUSES } from "../constants/contributionStatuses.js";
import { CYCLE_STATUSES } from "../constants/cycleStatuses.js";
import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import { MEMBER_STATUSES } from "../constants/memberStatuses.js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import * as contributionRepository from "../repositories/contributionRepository.js";
import * as cycleRepository from "../repositories/cycleRepository.js";
import * as drawRepository from "../repositories/drawRepository.js";
import * as groupRepository from "../repositories/groupRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import * as payoutRepository from "../repositories/payoutRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { formatDate, formatMoney, humanize } from "../utils/format.js";
import logger from "../utils/logger.js";
import * as notificationService from "./notificationService.js";

const safely = async (label, task) => {
  try {
    await task();
  } catch (error) {
    logger.error(`Notification event ${label} failed: ${error.message}`);
  }
};

const userIdsOf = (members) => members.map((member) => member.user);

const loadName = async (userId) =>
  (await userRepository.findById(userId, { select: "fullName", lean: true }))
    ?.fullName ?? "A member";

export const notifyGroupStarted = (groupId) =>
  safely("group-started", async () => {
    const [group, cycle, members] = await Promise.all([
      groupRepository.findById(groupId),
      cycleRepository.findCurrent(groupId),
      memberRepository.listActiveByGroup(groupId),
    ]);

    if (!group || !cycle) return;

    await notificationService.sendToMany(userIdsOf(members), {
      type: NOTIFICATION_TYPES.GROUP_STARTED,
      title: `${group.name} has started`,
      message: `Your first contribution of ${formatMoney(group.contributionAmount)} is due on ${formatDate(cycle.dueDate)}.`,
      groupId: group._id,
      cycleId: cycle._id,
      entityType: "Group",
      entityId: group._id,
      data: { dueDate: cycle.dueDate, amount: group.contributionAmount },
      dedupeKey: `group-started:${group._id}`,
    });

    emitToGroup(groupId, SOCKET_EVENTS.GROUP_UPDATED, {
      groupId: String(group._id),
      status: group.status,
    });
  });

export const notifyGroupCancelled = (groupId) =>
  safely("group-cancelled", async () => {
    const [group, members] = await Promise.all([
      groupRepository.findById(groupId),
      memberRepository.listActiveByGroup(groupId),
    ]);

    if (!group) return;

    const recipients = members
      .filter((member) => String(member.user) !== String(group.createdBy))
      .map((member) => member.user);

    await notificationService.sendToMany(recipients, {
      type: NOTIFICATION_TYPES.GROUP_CANCELLED,
      title: `${group.name} was cancelled`,
      message: `The organizer cancelled ${group.name} before it started.`,
      groupId: group._id,
      entityType: "Group",
      entityId: group._id,
      dedupeKey: `group-cancelled:${group._id}`,
    });

    emitToGroup(groupId, SOCKET_EVENTS.GROUP_UPDATED, {
      groupId: String(group._id),
      status: group.status,
    });
  });

export const notifyMembershipRequested = ({ groupId, applicantId, status }) =>
  safely("membership-requested", async () => {
    const [group, name] = await Promise.all([
      groupRepository.findById(groupId),
      loadName(applicantId),
    ]);

    if (!group) return;

    const pending = status === MEMBER_STATUSES.PENDING;

    await notificationService.send({
      userId: group.createdBy,
      type: pending
        ? NOTIFICATION_TYPES.MEMBERSHIP_REQUEST
        : NOTIFICATION_TYPES.MEMBER_JOINED,
      title: pending ? "New join request" : "New member joined",
      message: pending
        ? `${name} asked to join ${group.name}.`
        : `${name} joined ${group.name} (${group.memberCount} of ${group.maxMembers} members).`,
      groupId: group._id,
      entityType: "Group",
      entityId: group._id,
      data: { applicantId: String(applicantId), status },
    });

    emitToGroup(groupId, SOCKET_EVENTS.MEMBERS_CHANGED, {
      groupId: String(group._id),
      memberCount: group.memberCount,
    });
  });

export const notifyMembershipReviewed = (memberId, approved) =>
  safely("membership-reviewed", async () => {
    const member = await memberRepository.findById(memberId);

    if (!member) return;

    const group = await groupRepository.findById(member.group);

    if (!group) return;

    await notificationService.send({
      userId: member.user,
      type: approved
        ? NOTIFICATION_TYPES.MEMBERSHIP_APPROVED
        : NOTIFICATION_TYPES.MEMBERSHIP_REJECTED,
      title: approved ? "Join request approved" : "Join request declined",
      message: approved
        ? `You are now a member of ${group.name}.`
        : `Your request to join ${group.name} was declined.`,
      groupId: group._id,
      entityType: "Member",
      entityId: member._id,
    });

    emitToGroup(group._id, SOCKET_EVENTS.MEMBERS_CHANGED, {
      groupId: String(group._id),
      memberCount: group.memberCount,
    });
  });

export const notifyMemberRemoved = (groupId, memberId) =>
  safely("member-removed", async () => {
    const member = await memberRepository.findById(memberId);

    if (!member) return;

    const group = await groupRepository.findById(groupId);

    if (!group) return;

    evictUserFromGroup(member.user, groupId);

    await notificationService.send({
      userId: member.user,
      type: NOTIFICATION_TYPES.MEMBER_REMOVED,
      title: "Removed from group",
      message: `The organizer removed you from ${group.name}.`,
      groupId: group._id,
      entityType: "Member",
      entityId: member._id,
    });

    emitToGroup(groupId, SOCKET_EVENTS.MEMBERS_CHANGED, {
      groupId: String(group._id),
      memberCount: group.memberCount,
    });
  });

export const notifyMemberLeft = (groupId, userId) =>
  safely("member-left", async () => {
    const [group, name] = await Promise.all([
      groupRepository.findById(groupId),
      loadName(userId),
    ]);

    if (!group) return;

    evictUserFromGroup(userId, groupId);

    await notificationService.send({
      userId: group.createdBy,
      type: NOTIFICATION_TYPES.MEMBER_LEFT,
      title: "Member left",
      message: `${name} left ${group.name}.`,
      groupId: group._id,
      entityType: "Group",
      entityId: group._id,
      data: { memberUserId: String(userId) },
    });

    emitToGroup(groupId, SOCKET_EVENTS.MEMBERS_CHANGED, {
      groupId: String(group._id),
      memberCount: group.memberCount,
    });
  });

export const notifyContributionResolved = (contributionId) =>
  safely("contribution-resolved", async () => {
    const contribution = await contributionRepository.findById(contributionId);

    if (!contribution) return;

    const [group, cycle] = await Promise.all([
      groupRepository.findById(contribution.group),
      cycleRepository.findById(contribution.cycle),
    ]);

    if (!group || !cycle) return;

    const paid = contribution.status === CONTRIBUTION_STATUSES.PAID;

    await notificationService.send({
      userId: contribution.user,
      type: paid
        ? NOTIFICATION_TYPES.CONTRIBUTION_RECEIVED
        : NOTIFICATION_TYPES.CONTRIBUTION_WAIVED,
      title: paid ? "Contribution received" : "Contribution waived",
      message: paid
        ? `Your contribution of ${formatMoney(contribution.amountPaid)} to ${group.name} (cycle ${cycle.number}) was received.`
        : `Your contribution to ${group.name} (cycle ${cycle.number}) was waived.`,
      groupId: group._id,
      cycleId: cycle._id,
      entityType: "Contribution",
      entityId: contribution._id,
      data: { amount: contribution.amountPaid, isLate: contribution.isLate },
      dedupeKey: `contribution-resolved:${contribution._id}`,
    });

    emitToGroup(group._id, SOCKET_EVENTS.CONTRIBUTION_UPDATED, {
      groupId: String(group._id),
      cycleId: String(cycle._id),
      contributionId: String(contribution._id),
      status: contribution.status,
    });

    emitToGroup(group._id, SOCKET_EVENTS.CYCLE_UPDATED, {
      groupId: String(group._id),
      cycleId: String(cycle._id),
      status: cycle.status,
      resolvedCount: cycle.resolvedCount,
      expectedCount: cycle.expectedCount,
      collectedAmount: cycle.collectedAmount,
    });

    if (cycle.status === CYCLE_STATUSES.COLLECTED) {
      await notificationService.send({
        userId: group.createdBy,
        type: NOTIFICATION_TYPES.CYCLE_COLLECTED,
        title: "Cycle fully collected",
        message: `All contributions for cycle ${cycle.number} of ${group.name} are in (${formatMoney(cycle.collectedAmount)}). You can now perform the draw.`,
        groupId: group._id,
        cycleId: cycle._id,
        entityType: "Cycle",
        entityId: cycle._id,
        data: { collectedAmount: cycle.collectedAmount },
        dedupeKey: `cycle-collected:${cycle._id}`,
      });
    }
  });

export const notifyDrawCompleted = (drawId) =>
  safely("draw-completed", async () => {
    const draw = await drawRepository.findById(drawId);

    if (!draw) return;

    const [group, members, winnerName] = await Promise.all([
      groupRepository.findById(draw.group),
      memberRepository.listActiveByGroup(draw.group),
      loadName(draw.winnerUser),
    ]);

    if (!group) return;

    const winnerUserId = String(draw.winnerUser);
    const others = userIdsOf(members).filter(
      (userId) => String(userId) !== winnerUserId,
    );

    await notificationService.sendToMany(others, {
      type: NOTIFICATION_TYPES.DRAW_COMPLETED,
      title: "Draw completed",
      message: `${winnerName} won the draw for cycle ${draw.cycleNumber} of ${group.name}.`,
      groupId: group._id,
      cycleId: draw.cycle,
      entityType: "Draw",
      entityId: draw._id,
      data: { winnerUserId },
      dedupeKey: `draw:${draw._id}`,
    });

    await notificationService.send({
      userId: draw.winnerUser,
      type: NOTIFICATION_TYPES.DRAW_WON,
      title: "You won the draw",
      message: `You won the cycle ${draw.cycleNumber} draw in ${group.name}. The organizer will arrange your payout.`,
      groupId: group._id,
      cycleId: draw.cycle,
      entityType: "Draw",
      entityId: draw._id,
      data: { winnerUserId },
      dedupeKey: `draw:${draw._id}`,
    });

    emitToGroup(group._id, SOCKET_EVENTS.DRAW_COMPLETED, {
      groupId: String(group._id),
      cycleId: String(draw.cycle),
      drawId: String(draw._id),
      cycleNumber: draw.cycleNumber,
      winnerUserId,
      winnerName,
    });
  });

export const notifyPayoutPaid = (payoutId) =>
  safely("payout-paid", async () => {
    const payout = await payoutRepository.findById(payoutId);

    if (!payout) return;

    const [group, cycle, members] = await Promise.all([
      groupRepository.findById(payout.group),
      cycleRepository.findById(payout.cycle),
      memberRepository.listActiveByGroup(payout.group),
    ]);

    if (!group || !cycle) return;

    await notificationService.send({
      userId: payout.user,
      type: NOTIFICATION_TYPES.PAYOUT_PAID,
      title: "Payout recorded",
      message: `Your payout of ${formatMoney(payout.amount)} from ${group.name} (cycle ${cycle.number}) was recorded as paid by ${humanize(payout.paymentMethod)}.`,
      groupId: group._id,
      cycleId: cycle._id,
      entityType: "Payout",
      entityId: payout._id,
      data: { amount: payout.amount, paymentMethod: payout.paymentMethod },
      dedupeKey: `payout-paid:${payout._id}`,
    });

    emitToGroup(group._id, SOCKET_EVENTS.PAYOUT_PAID, {
      groupId: String(group._id),
      cycleId: String(cycle._id),
      payoutId: String(payout._id),
      cycleNumber: cycle.number,
      groupStatus: group.status,
    });

    if (group.status === GROUP_STATUSES.COMPLETED) {
      await notificationService.sendToMany(userIdsOf(members), {
        type: NOTIFICATION_TYPES.GROUP_COMPLETED,
        title: "Equb completed",
        message: `${group.name} is complete. Every member has received a payout.`,
        groupId: group._id,
        entityType: "Group",
        entityId: group._id,
        dedupeKey: `group-completed:${group._id}`,
      });

      emitToGroup(group._id, SOCKET_EVENTS.GROUP_UPDATED, {
        groupId: String(group._id),
        status: group.status,
      });

      return;
    }

    const next = await cycleRepository.findCurrent(group._id);

    if (!next) return;

    await notificationService.sendToMany(userIdsOf(members), {
      type: NOTIFICATION_TYPES.CONTRIBUTION_DUE,
      title: `Cycle ${next.number} contributions open`,
      message: `Your contribution of ${formatMoney(group.contributionAmount)} to ${group.name} is due on ${formatDate(next.dueDate)}.`,
      groupId: group._id,
      cycleId: next._id,
      entityType: "Cycle",
      entityId: next._id,
      data: { dueDate: next.dueDate, amount: group.contributionAmount },
      dedupeKey: `cycle-open:${next._id}`,
    });

    emitToGroup(group._id, SOCKET_EVENTS.CYCLE_UPDATED, {
      groupId: String(group._id),
      cycleId: String(next._id),
      status: next.status,
      resolvedCount: next.resolvedCount,
      expectedCount: next.expectedCount,
      collectedAmount: next.collectedAmount,
    });
  });
