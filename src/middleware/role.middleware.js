import { createApiError } from '../utils/ApiError.js';

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    throw createApiError(401, 'Not authenticated');
  }
  if (req.user.role !== role) {
    throw createApiError(403, `Forbidden: requires ${role} role`);
  }
  next();
};