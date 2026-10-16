const pad = (value) => String(value).padStart(2, "0");

export const todayInputValue = () => {
  const now = new Date();

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const nowLocalInputValue = () => {
  const now = new Date();

  return `${todayInputValue()}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export const localInputToIso = (value) =>
  value ? new Date(value).toISOString() : undefined;
