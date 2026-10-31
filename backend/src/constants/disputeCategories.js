export const DISPUTE_CATEGORIES = Object.freeze({
  CONTRIBUTION_NOT_RECORDED: "contribution_not_recorded",
  PAYOUT_NOT_RECEIVED: "payout_not_received",
  WRONG_AMOUNT: "wrong_amount",
  UNFAIR_PENALTY: "unfair_penalty",
  MEMBER_CONDUCT: "member_conduct",
  OTHER: "other",
});

export const DISPUTE_CATEGORY_VALUES = Object.freeze(
  Object.values(DISPUTE_CATEGORIES),
);
