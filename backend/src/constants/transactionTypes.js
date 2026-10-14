export const TRANSACTION_TYPES = Object.freeze({
  CONTRIBUTION: "contribution",
  PAYOUT: "payout",
});

export const TRANSACTION_TYPE_VALUES = Object.freeze(
  Object.values(TRANSACTION_TYPES),
);

export const TRANSACTION_DIRECTIONS = Object.freeze({
  IN: "in",
  OUT: "out",
});

export const TRANSACTION_DIRECTION_VALUES = Object.freeze(
  Object.values(TRANSACTION_DIRECTIONS),
);
