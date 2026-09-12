// src/middleware/error.middleware.js

import { createApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // PostgreSQL unique violation
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (process.env.NODE_ENV !== 'production' && !(err.createApiError)) {
    console.error(err); // log unexpected errors only
  }

  return ApiResponse.error(res, { statusCode, message, errors });
};

export default errorMiddleware;