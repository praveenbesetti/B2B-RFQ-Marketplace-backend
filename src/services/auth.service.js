// src/services/auth.service.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pgPool from '../config/pg.js';
import { createApiError } from '../utils/ApiError.js';

const SALT_ROUNDS = 10;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

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

  const token = generateToken(user);
  return { user, token };
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

  const token = generateToken(user);
  delete user.password_hash;

  return { user, token };
};

export default { signup, login };