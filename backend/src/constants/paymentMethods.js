export const PAYMENT_METHODS = Object.freeze({
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  TELEBIRR: "telebirr",
  CBE_BIRR: "cbe_birr",
  CHAPA: "chapa",
  OTHER: "other",
});

export const PAYMENT_METHOD_VALUES = Object.freeze(
  Object.values(PAYMENT_METHODS),
);

export const MANUAL_PAYMENT_METHOD_VALUES = Object.freeze(
  PAYMENT_METHOD_VALUES.filter((method) => method !== PAYMENT_METHODS.CHAPA),
);
