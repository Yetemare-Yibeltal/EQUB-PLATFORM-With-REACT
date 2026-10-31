export const DISPUTE_STATUSES = Object.freeze({
  OPEN: "open",
  IN_REVIEW: "in_review",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
});

export const DISPUTE_STATUS_VALUES = Object.freeze(
  Object.values(DISPUTE_STATUSES),
);

export const ACTIVE_DISPUTE_STATUSES = Object.freeze([
  DISPUTE_STATUSES.OPEN,
  DISPUTE_STATUSES.IN_REVIEW,
]);

export const FINAL_DISPUTE_STATUSES = Object.freeze([
  DISPUTE_STATUSES.RESOLVED,
  DISPUTE_STATUSES.DISMISSED,
]);
