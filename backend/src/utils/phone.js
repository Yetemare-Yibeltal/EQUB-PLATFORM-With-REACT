const INTERNATIONAL_PATTERN = /^(?:\+|00)?251([79]\d{8})$/;
const LOCAL_PATTERN = /^0([79]\d{8})$/;

export const normalizePhone = (value) => {
  if (typeof value !== "string") return null;

  const cleaned = value.replace(/[\s\-().]/g, "");
  const match =
    cleaned.match(INTERNATIONAL_PATTERN) || cleaned.match(LOCAL_PATTERN);

  return match ? `+251${match[1]}` : null;
};

export const isValidPhone = (value) => normalizePhone(value) !== null;
