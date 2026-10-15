export const formatMoney = (santim) => {
  const amount = Number(santim) / 100;

  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
};

export const formatDate = (value) => new Date(value).toISOString().slice(0, 10);

export const clip = (text, max) => {
  const value = String(text ?? "");

  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

export const humanize = (value) => String(value ?? "").replace(/_/g, " ");
