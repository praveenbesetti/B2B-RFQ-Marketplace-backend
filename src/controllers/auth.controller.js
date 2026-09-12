// src/controllers/auth.controller.js

import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import authService from '../services/auth.service.js';

const signup = asyncHandler(async (req, res) => {
  const { user, token  } = await authService.signup(req.body);
  return ApiResponse.success(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user, token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Login successful',
    data: { user, token },
  });
});

// GET /auth/me — quick sanity check the token maps to a real user
const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Current user fetched',
    data: { user: req.user },
  });
});

export default { signup, login, getMe };