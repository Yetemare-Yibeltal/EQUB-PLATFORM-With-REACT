export const MEMBER_STATUSES = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
  REMOVED: "removed",
  LEFT: "left",
});

export const MEMBER_STATUS_VALUES = Object.freeze(
  Object.values(MEMBER_STATUSES),
);
