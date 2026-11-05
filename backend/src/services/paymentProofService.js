import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { CONTRIBUTION_STATUSES } from "../constants/contributionStatuses.js";
import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import { MEMBER_ROLES } from "../constants/memberRoles.js";
import { MEMBER_STATUSES } from "../constants/memberStatuses.js";
import { PAYMENT_PROOF_STATUSES } from "../constants/paymentProofStatuses.js";
import { USER_ROLES } from "../constants/roles.js";
import { STORED_FILE_KINDS } from "../constants/storedFileKinds.js";
import * as contributionRepository from "../repositories/contributionRepository.js";
import * as paymentProofRepository from "../repositories/paymentProofRepository.js";
import ApiError from "../utils/apiError.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import withTransaction from "../utils/transaction.js";
import * as auditService from "./auditService.js";
import { applyResolution } from "./contributionService.js";
import * as fileService from "./fileService.js";
import { requireAccess } from "./groupService.js";
import * as notificationEventService from "./notificationEventService.js";
import * as paymentProofNotificationService from "./paymentProofNotificationService.js";

const USER_FIELDS = "fullName avatarUrl";

const POPULATE = [
  { path: "user", select: USER_FIELDS },
  { path: "cycle", select: "number dueDate" },
  {
    path: "contribution",
    select: "amount latePenaltyAmount lateAfter status",
  },
];

const isSame = (a, b) => Boolean(a) && Boolean(b) && String(a) === String(b);

const canReview = (actor, membership) =>
  actor.role === USER_ROLES.ADMIN ||
  (membership?.status === MEMBER_STATUSES.ACTIVE &&
    membership.role === MEMBER_ROLES.ORGANIZER);

const requireReviewer = async (actor, groupId) => {
  const { group, membership } = await requireAccess(actor, groupId);

  if (!canReview(actor, membership)) {
    throw ApiError.forbidden(
      "Only the group organizer or an administrator can review payment proofs",
    );
  }

  return group;
};

const requireActiveGroup = (group) => {
  if (group.status !== GROUP_STATUSES.ACTIVE) {
    throw ApiError.conflict(
      "Payments can only be handled while the group is active",
    );
  }
};

const loadProof = async (groupId, proofId) => {
  const proof = await paymentProofRepository.findById(proofId);

  if (!proof || String(proof.group) !== String(groupId)) {
    throw ApiError.notFound("Payment proof not found");
  }

  return proof;
};

const present = async (proof) => {
  await proof.populate(POPULATE);

  return proof.toJSON();
};

export const submitProof = async (
  actor,
  groupId,
  contributionId,
  { method, reference, note },
  file,
) => {
  const { group, membership } = await requireAccess(actor, groupId);

  if (!membership || membership.status !== MEMBER_STATUSES.ACTIVE) {
    throw ApiError.forbidden("Only group members can send a payment proof");
  }

  requireActiveGroup(group);

  const contribution = await contributionRepository.findById(contributionId);

  if (!contribution || String(contribution.group) !== String(groupId)) {
    throw ApiError.notFound("Contribution not found");
  }

  if (!isSame(contribution.user, actor.id)) {
    throw ApiError.forbidden(
      "You can only send a payment proof for your own contribution",
    );
  }

  if (contribution.status !== CONTRIBUTION_STATUSES.PENDING) {
    throw ApiError.conflict("This contribution has already been resolved");
  }

  const existing = await paymentProofRepository.findPendingByContribution(
    contribution._id,
  );

  if (existing) {
    throw ApiError.conflict(
      "A payment proof for this contribution is already waiting for approval",
    );
  }

  const screenshot = file
    ? await fileService.storeImage(
        actor.id,
        STORED_FILE_KINDS.PAYMENT_PROOF,
        file,
      )
    : null;

  let proof;

  try {
    proof = await paymentProofRepository.create({
      group: group._id,
      cycle: contribution.cycle,
      contribution: contribution._id,
      user: actor.id,
      method,
      reference,
      note: note ?? "",
      ...(screenshot ? { screenshot: screenshot._id } : {}),
    });
  } catch (error) {
    if (screenshot) await fileService.removeImage(screenshot._id, actor.id);

    if (error?.code === 11000) {
      throw ApiError.conflict(
        "This transaction reference has already been used",
      );
    }

    throw error;
  }

  await paymentProofNotificationService.notifyProofSubmitted(proof);

  return present(proof);
};

export const listGroupProofs = async (actor, groupId, query = {}) => {
  const { membership } = await requireAccess(actor, groupId);

  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50 });
  const sort = parseSort(query.sort, ["createdAt"], "-createdAt");

  const filter = { group: groupId };

  if (!canReview(actor, membership)) filter.user = actor.id;
  if (query.status) filter.status = query.status;

  const { items, meta } = await paymentProofRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: POPULATE,
  });

  return { items: items.map((item) => item.toJSON()), meta };
};

export const getScreenshot = async (actor, groupId, proofId) => {
  const { membership } = await requireAccess(actor, groupId);
  const proof = await loadProof(groupId, proofId);

  if (!canReview(actor, membership) && !isSame(proof.user, actor.id)) {
    throw ApiError.forbidden("You cannot view this payment screenshot");
  }

  if (!proof.screenshot) {
    throw ApiError.notFound("This payment proof has no screenshot");
  }

  return fileService.getImage(
    proof.screenshot,
    STORED_FILE_KINDS.PAYMENT_PROOF,
  );
};

export const approveProof = async (actor, groupId, proofId) => {
  const group = await requireReviewer(actor, groupId);
  requireActiveGroup(group);

  const proof = await loadProof(groupId, proofId);

  if (isSame(proof.user, actor.id)) {
    throw ApiError.forbidden("You cannot review your own payment proof");
  }

  if (proof.status !== PAYMENT_PROOF_STATUSES.PENDING) {
    throw ApiError.conflict("This payment proof has already been reviewed");
  }

  const target = await contributionRepository.findById(proof.contribution);

  if (!target || target.status !== CONTRIBUTION_STATUSES.PENDING) {
    throw ApiError.conflict(
      "This contribution has already been resolved. Reject this proof instead",
    );
  }

  const paymentTime = proof.createdAt;
  const isLate = paymentTime.getTime() >= target.lateAfter.getTime();
  const penaltyAmount = isLate ? target.latePenaltyAmount : 0;
  const amountPaid = target.amount + penaltyAmount;

  const { proof: approved, contribution } = await withTransaction(
    async (session) => {
      const updatedProof = await paymentProofRepository.transition(
        proof._id,
        [PAYMENT_PROOF_STATUSES.PENDING],
        {
          status: PAYMENT_PROOF_STATUSES.APPROVED,
          reviewedBy: actor.id,
          reviewedAt: new Date(),
        },
        { session },
      );

      if (!updatedProof) {
        throw ApiError.conflict("This payment proof has already been reviewed");
      }

      const resolved = await applyResolution(session, target._id, {
        collectedAmount: amountPaid,
        update: {
          $set: {
            status: CONTRIBUTION_STATUSES.PAID,
            isLate,
            amountPaid,
            paidAt: paymentTime,
            paymentMethod: proof.method,
            reference: proof.reference,
            note: proof.note ?? "",
            recordedBy: actor.id,
          },
        },
        ledger: {
          amount: amountPaid,
          penaltyAmount,
          method: proof.method,
          reference: proof.reference,
          recordedBy: actor.id,
          occurredAt: paymentTime,
        },
      });

      await auditService.record(
        {
          actorId: actor.id,
          action: AUDIT_ACTIONS.PAYMENT_PROOF_REVIEWED,
          groupId: updatedProof.group,
          cycleId: updatedProof.cycle,
          entityType: "PaymentProof",
          entityId: updatedProof._id,
          metadata: {
            decision: PAYMENT_PROOF_STATUSES.APPROVED,
            method: updatedProof.method,
            reference: updatedProof.reference,
            contribution: String(updatedProof.contribution),
            member: String(updatedProof.user),
            amountPaid,
          },
        },
        { session },
      );

      return { proof: updatedProof, contribution: resolved };
    },
  );

  await notificationEventService.notifyContributionResolved(
    String(contribution._id),
  );
  await paymentProofNotificationService.notifyProofApproved(approved);

  return present(approved);
};

export const rejectProof = async (actor, groupId, proofId, reason) => {
  const group = await requireReviewer(actor, groupId);
  requireActiveGroup(group);

  const proof = await loadProof(groupId, proofId);

  if (isSame(proof.user, actor.id)) {
    throw ApiError.forbidden("You cannot review your own payment proof");
  }

  const rejected = await withTransaction(async (session) => {
    const updated = await paymentProofRepository.transition(
      proof._id,
      [PAYMENT_PROOF_STATUSES.PENDING],
      {
        status: PAYMENT_PROOF_STATUSES.REJECTED,
        isActive: false,
        reviewedBy: actor.id,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
      { session },
    );

    if (!updated) {
      throw ApiError.conflict("This payment proof has already been reviewed");
    }

    await auditService.record(
      {
        actorId: actor.id,
        action: AUDIT_ACTIONS.PAYMENT_PROOF_REVIEWED,
        groupId: updated.group,
        cycleId: updated.cycle,
        entityType: "PaymentProof",
        entityId: updated._id,
        metadata: {
          decision: PAYMENT_PROOF_STATUSES.REJECTED,
          method: updated.method,
          reference: updated.reference,
          contribution: String(updated.contribution),
          member: String(updated.user),
          reason,
        },
      },
      { session },
    );

    return updated;
  });

  await paymentProofNotificationService.notifyProofRejected(rejected);

  return present(rejected);
};
