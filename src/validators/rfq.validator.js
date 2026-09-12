// src/validators/rfq.validator.js

import Joi from 'joi';

const createRfqSchema = Joi.object({
  product_name: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  quantity: Joi.number().integer().positive().required(),
  delivery_location: Joi.string().trim().min(2).max(200).required(),
  deadline: Joi.date().iso().greater('now').required()
    .messages({ 'date.greater': 'Deadline must be a future date' }),
});

const updateRfqSchema = Joi.object({
  product_name: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().min(10).max(2000),
  quantity: Joi.number().integer().positive(),
  delivery_location: Joi.string().trim().min(2).max(200),
  deadline: Joi.date().iso().greater('now'),
}).min(1); // at least one field required on update

const acceptQuotationSchema = Joi.object({
  quotation_id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const listRfqQuerySchema = Joi.object({
  search: Joi.string().trim().max(150).allow(''),
  status: Joi.string().valid('open', 'closed', 'accepted'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export { createRfqSchema, updateRfqSchema, acceptQuotationSchema, listRfqQuerySchema };
export default { createRfqSchema, updateRfqSchema, acceptQuotationSchema, listRfqQuerySchema };