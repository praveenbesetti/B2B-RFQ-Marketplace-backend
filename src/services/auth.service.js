// src/services/auth.service.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pgPool from '../config/pg.js';
import { createApiError } from '../utils/ApiError.js';

const SALT_ROUNDS = 10;

const tokenPayload = (user) => ({ id: user.id, email: user.email, role: user.role });

const generateAccessToken = (user) => {
  return jwt.sign(
    tokenPayload(user),
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (user) => jwt.sign(
  tokenPayload(user),
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
);

const createAuthResult = (user) => ({
  user,
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
});

const signup = async ({ name, email, password, role,  }) => {
  const existingResult = await pgPool.query(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  if (existingResult.rows[0]) {
    throw createApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const insertResult = await pgPool.query(
    `INSERT INTO users (name, email, password_hash, role, company_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, company_name, created_at`,
    [name, email, passwordHash, role, '']
  );

  const user = insertResult.rows[0];
  if (!user) throw createApiError(500, 'Failed to create account');

  return createAuthResult(user);
};

const login = async ({ email, password }) => {
  const result = await pgPool.query(
    'SELECT id, name, email, password_hash, role, company_name FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  const user = result.rows[0];
  if (!user) throw createApiError(401, 'Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw createApiError(401, 'Invalid email or password');

  delete user.password_hash;

  return createAuthResult(user);
};

const refresh = (refreshToken) => {
  if (!refreshToken) throw createApiError(401, 'Refresh token missing');
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    return generateAccessToken(decoded);
  } catch (error) {
    throw createApiError(401, 'Invalid or expired refresh token');
  }
};

export default { signup, login, refresh };