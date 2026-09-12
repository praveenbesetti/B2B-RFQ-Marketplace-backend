// src/middleware/auth.middleware.js

import jwt from 'jsonwebtoken';
import { createApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createApiError(401, 'Authentication token missing');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id, role, email, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw createApiError(401, 'Token expired, please log in again');
    }
    throw createApiError(401, 'Invalid authentication token');
  }
});

export default authenticate;