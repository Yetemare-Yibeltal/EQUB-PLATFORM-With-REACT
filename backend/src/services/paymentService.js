import crypto from "node:crypto";
import paymentConfig from "../config/payment.js";
import { CONTRIBUTION_STATUSES } from "../constants/contributionStatuses.js";
import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import { PAYMENT_METHODS } from "../constants/paymentMethods.js";
import { PAYMENT_STATUSES } from "../constants/paymentStatuses.js";
import * as contributionRepository from "../repositories/contributionRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import * as paymentRepository from "../repositories/paymentRepository.js";
import ApiError from "../utils/apiError.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import withTransaction from "../utils/transaction.js";
import * as chapaService from "./chapaService.js";
import { applyResolution } from "./contributionService.js";
import { canManage, requireAccess } from "./groupService.js";
import * as notificationEventService from "./notificationEventService.js";

const SORTABLE_FIELDS = ["createdAt", "amount", "verifiedAt"];
const SETTLEABLE_STATUSES = [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.FAILED];
const POPULATE_OWN = [
  { path: "group", select: "name" },
  { path: "cycle", select: "number dueDate" },
];
const POPULATE_ADMIN = [
  { path: "user", select: "fullName phone" },
  { path: "group", select: "name" },
  { path: "cycle", select: "number dueDate" },
];

const generateTxRef = () => `eqb-${crypto.randomBytes(16).toString("hex")}`;

const truncate = (value, max) => String(value || "").slice(0, max);

const loadPaymentByTxRef = async (txRef) => {
  const payment = await paymentRepository.findByTxRef(txRef);

  if (!payment) {
    throw ApiError.notFound("Payment not found");
  }

  return payment;
};

const assertCanView = async (actor, payment) => {
  if (String(payment.user) === String(actor.id)) return;

  const membership = await memberRepository.findByGroupAndUser(
    payment.group,
    actor.id,
  );

  if (!canManage(actor, membership)) {
    throw ApiError.notFound("Payment not found");
  }
};

const markReviewNeeded = (payment, verification, note) =>
  paymentRepository.transition(payment._id, SETTLEABLE_STATUSES, {
    $set: {
      status: PAYMENT_STATUSES.FAILED,
      requiresReview: true,
      reviewNote: truncate(note, 500),
      providerReference: verification.reference,
    },
  });

const settleSuccess = async (payment, verification) => {
  if (
    verification.currency !== paymentConfig.currency ||
    verification.amount !== payment.amount
  ) {
    await markReviewNeeded(
      payment,
      verification,
      `Gateway reported ${verification.amount} santim ${verification.currency}, expected ${payment.amount} santim ${paymentConfig.currency}`,
    );

    return paymentRepository.findById(payment._id);
  }

  const now = new Date();

  const successFields = {
    status: PAYMENT_STATUSES.SUCCESS,
    verifiedAt: now,
    providerReference: verification.reference,
    method: truncate(verification.method, 50),
    failureReason: "",
  };

  let applied = false;

  try {
    await withTransaction(async (session) => {
      applied = false;

      const claimed = await paymentRepository.transition(
        payment._id,
        SETTLEABLE_STATUSES,
        { $set: successFields },
        { session },
      );

      if (!claimed) return;

      await applyResolution(session, payment.contribution, {
        collectedAmount: payment.amount,
        update: {
          $set: {
            status: CONTRIBUTION_STATUSES.PAID,
            isLate: payment.isLate,
            amountPaid: payment.amount,
            paidAt: now,
            paymentMethod: PAYMENT_METHODS.CHAPA,
            reference: payment.txRef,
            recordedBy: payment.user,
          },
        },
        ledger: {
          payment: payment._id,
          amount: payment.amount,
          penaltyAmount: payment.penaltyAmount,
          method: PAYMENT_METHODS.CHAPA,
          reference: payment.txRef,
          recordedBy: payment.user,
          occurredAt: now,
        },
      });

      applied = true;
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.statusCode !== 409) {
      throw error;
    }

    applied = false;

    await paymentRepository.transition(payment._id, SETTLEABLE_STATUSES, {
      $set: {
        ...successFields,
        requiresReview: true,
        reviewNote: truncate(
          `Payment received but not applied: ${error.message}`,
          500,
        ),
      },
    });
  }

  if (applied) {
    await notificationEventService.notifyContributionResolved(
      payment.contribution,
    );
  }

  return paymentRepository.findById(payment._id);
};

const reconcile = async (payment) => {
  const verification = await chapaService.verifyTransaction(payment.txRef);

  if (verification.state === "success") {
    return settleSuccess(payment, verification);
  }

  if (verification.state === "failed") {
    await paymentRepository.transition(
      payment._id,
      [PAYMENT_STATUSES.PENDING],
      {
        $set: {
          status: PAYMENT_STATUSES.FAILED,
          failureReason: "Payment was not completed",
        },
      },
    );
  }

  return paymentRepository.findById(payment._id);
};

export const initiateCheckout = async (actor, { groupId, contributionId }) => {
  const { group } = await requireAccess(actor, groupId);

  if (group.status !== GROUP_STATUSES.ACTIVE) {
    throw ApiError.conflict(
      "Payments are only accepted while the group is active",
    );
  }

  const contribution = await contributionRepository.findById(contributionId);

  if (!contribution || String(contribution.group) !== String(groupId)) {
    throw ApiError.notFound("Contribution not found");
  }

  if (String(contribution.user) !== String(actor.id)) {
    throw ApiError.forbidden("You can only pay your own contribution");
  }

  if (contribution.status !== CONTRIBUTION_STATUSES.PENDING) {
    throw ApiError.conflict("This contribution has already been resolved");
  }

  if (!chapaService.isConfigured()) {
    throw ApiError.serviceUnavailable("Online payments are not configured");
  }

  const isLate = Date.now() >= contribution.lateAfter.getTime();
  const penaltyAmount = isLate ? contribution.latePenaltyAmount : 0;
  const amount = contribution.amount + penaltyAmount;

  const reusable = await paymentRepository.findReusablePending({
    contributionId: contribution._id,
    userId: actor.id,
    amount,
    since: new Date(Date.now() - paymentConfig.checkoutWindowMs),
  });

  if (reusable) {
    return reusable.toJSON();
  }

  const payment = await paymentRepository.create({
    user: actor.id,
    group: contribution.group,
    cycle: contribution.cycle,
    contribution: contribution._id,
    txRef: generateTxRef(),
    amount,
    penaltyAmount,
    isLate,
    currency: paymentConfig.currency,
  });

  try {
    const { checkoutUrl } = await chapaService.initializeTransaction({
      txRef: payment.txRef,
      amount,
      user: actor,
    });

    const updated = await paymentRepository.setCheckoutUrl(
      payment._id,
      checkoutUrl,
    );

    return updated.toJSON();
  } catch (error) {
    await paymentRepository.transition(
      payment._id,
      [PAYMENT_STATUSES.PENDING],
      {
        $set: {
          status: PAYMENT_STATUSES.FAILED,
          failureReason: truncate(error.message, 300),
        },
      },
    );
    throw error;
  }
};

export const getPayment = async (actor, txRef) => {
  const payment = await loadPaymentByTxRef(txRef);

  await assertCanView(actor, payment);

  return payment.toJSON();
};

export const verifyPayment = async (actor, txRef) => {
  const payment = await loadPaymentByTxRef(txRef);

  await assertCanView(actor, payment);

  if (payment.status === PAYMENT_STATUSES.SUCCESS) {
    return payment.toJSON();
  }

  const result = await reconcile(payment);

  return result.toJSON();
};

export const processGatewayNotification = async (txRef) => {
  if (!txRef) return null;

  const payment = await paymentRepository.findByTxRef(txRef);

  if (!payment || payment.status === PAYMENT_STATUSES.SUCCESS) {
    return payment;
  }

  return reconcile(payment);
};

export const listMyPayments = async (actor, query = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-createdAt");

  const filter = { user: actor.id };

  if (query.status) filter.status = query.status;
  if (query.groupId) filter.group = query.groupId;

  const { items, meta } = await paymentRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: POPULATE_OWN,
  });

  return { items: items.map((item) => item.toJSON()), meta };
};

export const listPayments = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-createdAt");

  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.groupId) filter.group = query.groupId;
  if (query.userId) filter.user = query.userId;
  if (query.requiresReview !== undefined)
    filter.requiresReview = query.requiresReview;

  const { items, meta } = await paymentRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: POPULATE_ADMIN,
  });

  return { items: items.map((item) => item.toJSON()), meta };
};
