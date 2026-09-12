export const createApiError = (statusCode, message, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isApiError = true;
  if (details) error.errors = details;
  return error;
};


