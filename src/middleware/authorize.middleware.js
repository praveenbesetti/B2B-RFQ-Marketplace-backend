// src/middleware/authorize.middleware.js

import { createApiError } from '../utils/ApiError.js';

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    throw createApiError(401, 'Authentication required');
  }

  if (!allowedRoles.includes(req.user.role)) {
    const roles = allowedRoles.join(', ');
    throw createApiError(403, `Forbidden: requires one of the following roles: ${roles}`);
  }

  next();
};

export default authorize;
