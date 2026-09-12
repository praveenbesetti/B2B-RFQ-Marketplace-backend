// src/validators/auth.validator.js

import Joi from 'joi';

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(6).max(72).required(),
  role: Joi.string().valid('buyer', 'supplier').required(),
  company_name: Joi.string().trim().max(150).allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

export { signupSchema, loginSchema };
