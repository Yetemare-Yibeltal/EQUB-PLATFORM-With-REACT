export const PAYMENT_METHOD_LABELS = Object.freeze({
  cash: "Cash",
  bank_transfer: "Bank transfer",
  telebirr: "Telebirr",
  cbe_birr: "CBE Birr",
  chapa: "Chapa",
  other: "Other",
});

export const MANUAL_PAYMENT_METHODS = Object.freeze([
  { value: "cash", label: PAYMENT_METHOD_LABELS.cash },
  { value: "bank_transfer", label: PAYMENT_METHOD_LABELS.bank_transfer },
  { value: "telebirr", label: PAYMENT_METHOD_LABELS.telebirr },
  { value: "cbe_birr", label: PAYMENT_METHOD_LABELS.cbe_birr },
  { value: "other", label: PAYMENT_METHOD_LABELS.other },
]);
