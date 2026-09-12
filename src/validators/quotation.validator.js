// src/validators/quotation.validator.js

import Joi from 'joi';

const createQuotationSchema = Joi.object({
  price: Joi.number().positive().precision(2).required(),
  delivery_time: Joi.string().trim().min(2).max(100).required(), // e.g. "7 days", "2 weeks"
  message: Joi.string().trim().max(1000).allow('', null),
});

const updateQuotationSchema = createQuotationSchema.fork(
  ['price', 'delivery_time'],
  (field) => field.optional()
).min(1);

export { createQuotationSchema, updateQuotationSchema };
export default { createQuotationSchema, updateQuotationSchema };