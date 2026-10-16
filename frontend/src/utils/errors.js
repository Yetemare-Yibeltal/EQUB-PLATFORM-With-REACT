const DEFAULT_MESSAGE = "Something went wrong, please try again";
const NETWORK_MESSAGE =
  "Cannot reach the server, check your connection and try again";

export const getErrorMessage = (error, fallback = DEFAULT_MESSAGE) => {
  const message = error?.response?.data?.message;

  if (message) return message;
  if (error?.request && !error?.response) return NETWORK_MESSAGE;

  return fallback;
};

export const getFieldErrors = (error) => {
  const list = error?.response?.data?.errors;

  if (!Array.isArray(list)) return {};

  return list.reduce((fields, item) => {
    if (item?.field && !fields[item.field]) {
      fields[item.field] = item.message;
    }
    return fields;
  }, {});
};

export const isNetworkError = (error) =>
  Boolean(error?.request && !error?.response);
