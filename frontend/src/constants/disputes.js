export const DISPUTE_STATUS = Object.freeze({
  OPEN: "open",
  IN_REVIEW: "in_review",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
});

export const DISPUTE_STATUS_LABELS = Object.freeze({
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
  dismissed: "Dismissed",
});

export const DISPUTE_CATEGORY_LABELS = Object.freeze({
  contribution_not_recorded: "Contribution not recorded",
  payout_not_received: "Payout not received",
  wrong_amount: "Wrong amount",
  unfair_penalty: "Unfair penalty",
  member_conduct: "Member conduct",
  other: "Other",
});

export const isActiveDispute = (status) =>
  status === DISPUTE_STATUS.OPEN || status === DISPUTE_STATUS.IN_REVIEW;
