const formatter = new Intl.NumberFormat("en-US");

export const formatNumber = (value) =>
  Number.isFinite(Number(value)) ? formatter.format(Number(value)) : "—";

export const formatPercent = (value) =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? "—"
    : `${Math.round(Number(value))}%`;
