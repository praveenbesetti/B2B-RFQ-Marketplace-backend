// src/utils/apiResponse.js

const success = (res, { statusCode = 200, message = 'Success', data = null, meta = null }) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const error = (res, { statusCode = 500, message = 'Something went wrong', errors = null }) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

export default { success, error };