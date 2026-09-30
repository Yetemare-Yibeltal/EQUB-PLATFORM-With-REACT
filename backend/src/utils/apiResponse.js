export const sendSuccess = (
  res,
  {
    statusCode = 200,
    message = "Request successful",
    data = null,
    meta = null,
  } = {},
) => {
  const payload = { success: true, message };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

export const sendCreated = (
  res,
  { message = "Resource created", data = null, meta = null } = {},
) => sendSuccess(res, { statusCode: 201, message, data, meta });

export const sendNoContent = (res) => res.status(204).send();

export default sendSuccess;
