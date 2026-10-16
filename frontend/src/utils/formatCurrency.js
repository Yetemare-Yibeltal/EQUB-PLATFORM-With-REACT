const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatMoney = (santim) => {
  const value = Number(santim);

  return `${formatter.format(Number.isFinite(value) ? value / 100 : 0)} ETB`;
};

export const toSantim = (birr) => Math.round(Number(birr) * 100);

export const toBirr = (santim) => Number(santim) / 100;
