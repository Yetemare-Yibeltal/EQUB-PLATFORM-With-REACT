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
    logger.error(
      `Payment proof notification ${label} failed: ${error.message}`,
    );
  }
};

const loadName = async (userId) =>
  (await userRepository.findById(userId, { select: "fullName", lean: true }))
    ?.fullName ?? "A member";

const organizerIds = async (groupId) => {
  const members = await memberRepository.listActiveByGroup(groupId);

  return members
    .filter((member) => member.role === MEMBER_ROLES.ORGANIZER)
    .map((member) => String(member.user));
};

const payloadFor = (proof, group, extra) => ({
  groupId: proof.group,
  cycleId: proof.cycle,
  entityType: "PaymentProof",
  entityId: proof._id,
  data: {
    proofId: String(proof._id),
    contributionId: String(proof.contribution),
    groupName: group.name,
  },
  ...extra,
});

export const notifyProofSubmitted = (proof) =>
  safely("submitted", async () => {
    const [group, memberName, organizers] = await Promise.all([
      groupRepository.findById(proof.group),
      loadName(proof.user),
      organizerIds(proof.group),
    ]);

    if (!group) return;

    const recipients = organizers.filter((id) => id !== String(proof.user));
    if (recipients.length === 0) return;

    await notificationService.sendToMany(
      recipients,
      payloadFor(proof, group, {
        type: NOTIFICATION_TYPES.PAYMENT_PROOF_SUBMITTED,
        title: "Payment proof submitted",
        message: `${memberName} sent a payment proof (reference ${proof.reference}) for ${group.name}.`,
        dedupeKey: `payment-proof-submitted:${proof._id}`,
      }),
    );
  });

export const notifyProofApproved = (proof) =>
  safely("approved", async () => {
    const group = await groupRepository.findById(proof.group);
    if (!group) return;

    await notificationService.send({
      userId: proof.user,
      ...payloadFor(proof, group, {
        type: NOTIFICATION_TYPES.PAYMENT_PROOF_APPROVED,
        title: "Payment proof approved",
        message: `Your payment proof for ${group.name} was approved.`,
        dedupeKey: `payment-proof-approved:${proof._id}`,
      }),
    });
  });

export const notifyProofRejected = (proof) =>
  safely("rejected", async () => {
    const group = await groupRepository.findById(proof.group);
    if (!group) return;

    await notificationService.send({
      userId: proof.user,
      ...payloadFor(proof, group, {
        type: NOTIFICATION_TYPES.PAYMENT_PROOF_REJECTED,
        title: "Payment proof rejected",
        message: `Your payment proof for ${group.name} was rejected: ${proof.rejectReason}`,
        dedupeKey: `payment-proof-rejected:${proof._id}`,
      }),
    });
  });
