import { MEMBER_ROLES } from "../constants/memberRoles.js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";
import * as groupRepository from "../repositories/groupRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import logger from "../utils/logger.js";
import * as notificationService from "./notificationService.js";

const safely = async (label, task) => {
  try {
    await task();
  } catch (error) {
    logger.error(`Dispute notification ${label} failed: ${error.message}`);
  }
};

const loadName = async (userId) =>
  (await userRepository.findById(userId, { select: "fullName", lean: true }))
    ?.fullName ?? "A member";

const organizerIds = async (groupId) => {
  const members = await memberRepository.listActiveByGroup(groupId);

  return members
    .filter((member) => member.role === MEMBER_ROLES.ORGANIZER)
    .map((member) => member.user);
};

const uniqueRecipients = (ids, excludeId) => {
  const seen = new Set();

  return ids
    .filter(Boolean)
    .map((id) => String(id))
    .filter((id) => {
      if (id === String(excludeId) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
};

const payloadFor = (dispute, group, extra) => ({
  groupId: dispute.group,
  cycleId: dispute.cycle,
  entityType: "Dispute",
  entityId: dispute._id,
  data: { disputeId: String(dispute._id), groupName: group.name },
  ...extra,
});

export const notifyDisputeOpened = (dispute) =>
  safely("opened", async () => {
    const [group, reporterName, organizers] = await Promise.all([
      groupRepository.findById(dispute.group),
      loadName(dispute.reporter),
      organizerIds(dispute.group),
    ]);

    if (!group) return;

    const recipients = uniqueRecipients(organizers, dispute.reporter);
    if (recipients.length === 0) return;

    await notificationService.sendToMany(
      recipients,
      payloadFor(dispute, group, {
        type: NOTIFICATION_TYPES.DISPUTE_OPENED,
        title: "New dispute reported",
        message: `${reporterName} reported a problem in ${group.name}: ${dispute.subject}.`,
        dedupeKey: `dispute-opened:${dispute._id}`,
      }),
    );
  });

export const notifyDisputeComment = (dispute, comment, actorId) =>
  safely("comment", async () => {
    const [group, actorName, organizers] = await Promise.all([
      groupRepository.findById(dispute.group),
      loadName(actorId),
      organizerIds(dispute.group),
    ]);

    if (!group) return;

    const recipients = uniqueRecipients(
      [dispute.reporter, ...organizers],
      actorId,
    );
    if (recipients.length === 0) return;

    await notificationService.sendToMany(
      recipients,
      payloadFor(dispute, group, {
        type: NOTIFICATION_TYPES.DISPUTE_UPDATED,
        title: "Dispute updated",
        message: `${actorName} added a comment to the dispute "${dispute.subject}" in ${group.name}.`,
        dedupeKey: `dispute-comment:${dispute._id}:${comment._id}`,
      }),
    );
  });

export const notifyDisputeInReview = (dispute, actorId) =>
  safely("in-review", async () => {
    const group = await groupRepository.findById(dispute.group);
    if (!group) return;

    const recipients = uniqueRecipients([dispute.reporter], actorId);
    if (recipients.length === 0) return;

    await notificationService.sendToMany(
      recipients,
      payloadFor(dispute, group, {
        type: NOTIFICATION_TYPES.DISPUTE_UPDATED,
        title: "Dispute under review",
        message: `Your dispute "${dispute.subject}" in ${group.name} is now under review.`,
        dedupeKey: `dispute-review:${dispute._id}`,
      }),
    );
  });

export const notifyDisputeDecided = (dispute, actorId) =>
  safely("decided", async () => {
    const [group, organizers] = await Promise.all([
      groupRepository.findById(dispute.group),
      organizerIds(dispute.group),
    ]);

    if (!group) return;

    const resolved = dispute.status === "resolved";
    const recipients = uniqueRecipients(
      [dispute.reporter, dispute.against, ...organizers],
      actorId,
    );
    if (recipients.length === 0) return;

    await notificationService.sendToMany(
      recipients,
      payloadFor(dispute, group, {
        type: NOTIFICATION_TYPES.DISPUTE_RESOLVED,
        title: resolved ? "Dispute resolved" : "Dispute dismissed",
        message: resolved
          ? `The dispute "${dispute.subject}" in ${group.name} was resolved.`
          : `The dispute "${dispute.subject}" in ${group.name} was dismissed.`,
        dedupeKey: `dispute-decided:${dispute._id}`,
      }),
    );
  });
