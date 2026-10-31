export const AUDIT_ACTIONS = Object.freeze({
  DRAW_PERFORMED: "draw.performed",
  PAYOUT_PAID: "payout.paid",
  USER_STATUS_CHANGED: "user.status_changed",
  USER_ROLE_CHANGED: "user.role_changed",
  PAYMENT_REVIEW_RESOLVED: "payment.review_resolved",
  DISPUTE_DECIDED: "dispute.decided",
  JOB_RUN: "job.run",
});

export const AUDIT_ACTION_VALUES = Object.freeze(Object.values(AUDIT_ACTIONS));
