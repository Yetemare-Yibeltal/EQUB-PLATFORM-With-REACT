export const PAYMENT_PROOF_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const PAYMENT_PROOF_STATUS_VALUES = Object.freeze(
  Object.values(PAYMENT_PROOF_STATUSES),
);
