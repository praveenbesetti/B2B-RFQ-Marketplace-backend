// src/controllers/rfq.controller.js

import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import rfqService from '../services/rfq.service.js';
import { listRfqQuerySchema } from '../validators/rfq.validator.js';
import { createApiError } from '../utils/ApiError.js';
const create = asyncHandler(async (req, res) => {
  const rfq = await rfqService.createRfq(req.user.id, req.body);
  return ApiResponse.success(res, {
    statusCode: 201,
    message: 'RFQ created successfully',
    data: { rfq },
  });
});

const getMyRfqs = asyncHandler(async (req, res) => {
  const rfqs = await rfqService.getMyRfqs(req.user.id);
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Your RFQs fetched successfully',
    data: { rfqs },
  });
});

const browse = asyncHandler(async (req, res) => {
  const { error, value } = listRfqQuerySchema.validate(req.query, { abortEarly: false });
  if (error) throw createApiError(400, 'Invalid query parameters', error.details);

  const { rfqs, meta } = await rfqService.browseRfqs({ ...value, supplierId: req.user.id });
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'RFQs fetched successfully',
    data: { rfqs },
    meta,
  });
});

const getOne = asyncHandler(async (req, res) => {
  const rfq = await rfqService.getRfqById(req.params.id, req.user);
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'RFQ fetched successfully',
    data: { rfq },
  });
});

const getOneForBuyer = asyncHandler(async (req, res) => {
  const rfq = await rfqService.getBuyerRfqById(req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Buyer RFQ fetched successfully', data: { rfq } });
});

const getOneForSupplier = asyncHandler(async (req, res) => {
  const rfq = await rfqService.getSupplierRfqById(req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Supplier RFQ fetched successfully', data: { rfq } });
});

const update = asyncHandler(async (req, res) => {
  const rfq = await rfqService.updateRfq(req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'RFQ updated successfully',
    data: { rfq },
  });
});

const close = asyncHandler(async (req, res) => {
  const rfq = await rfqService.closeRfq(req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'RFQ closed successfully', data: { rfq } });
});

const accept = asyncHandler(async (req, res) => {
  const result = await rfqService.acceptQuotation(req.params.id, req.user.id, req.body.quotation_id);
  return ApiResponse.success(res, { message: 'Quotation accepted successfully', data: result });
});

export default { create, getMyRfqs, browse, getOne, getOneForBuyer, getOneForSupplier, update, close, accept };