// src/middleware/validate.middleware.js

import { createApiError } from '../utils/ApiError.js';

// Usage: validate(schema) — expects a Joi schema, validates req.body
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const formattedErrors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, ''),
    }));
    throw createApiError(400, 'Validation failed', formattedErrors);
  }

  req.body = value;
  next();
};

export default validate;