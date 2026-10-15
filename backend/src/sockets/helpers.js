export const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export const isObjectId = (value) =>
  typeof value === "string" && OBJECT_ID_PATTERN.test(value);

export const normalizeArgs = (payload, ack) => {
  if (typeof payload === "function") {
    return { data: undefined, reply: payload };
  }

  return { data: payload, reply: typeof ack === "function" ? ack : () => {} };
};

export const failure = (error) => ({
  ok: false,
  message: error?.isOperational ? error.message : "Request failed",
});
