// src/controllers/auth.controller.js

import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import authService from '../services/auth.service.js';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refresh_token', refreshToken, refreshCookieOptions);
};

const signup = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.signup(req.body);
  setRefreshCookie(res, refreshToken);
  return ApiResponse.success(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user, token: accessToken },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Login successful',
    data: { user, token: accessToken },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const accessToken = authService.refresh(req.cookies.refresh_token);
  return ApiResponse.success(res, { message: 'Access token refreshed', data: { token: accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refresh_token', { ...refreshCookieOptions, maxAge: undefined });
  return ApiResponse.success(res, { message: 'Logged out successfully', data: null });
});

// GET /auth/me — quick sanity check the token maps to a real user
const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Current user fetched',
    data: { user: req.user },
  });
});

export default { signup, login, refresh, logout, getMe };