// src/controllers/quotation.controller.js
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import quotationService from '../services/quotation.service.js';
const submit = asyncHandler(async (req, res) => {
  const quotation = await quotationService.submitQuotation(
    req.params.rfqId,
    req.user.id,
    req.body
  );
  return ApiResponse.success(res, {
    statusCode: 201,
    message: 'Quotation submitted successfully',
    data: { quotation },
  });
});

const getMyQuotations = asyncHandler(async (req, res) => {
  const quotations = await quotationService.getMyQuotations(req.user.id);
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Your quotations fetched successfully',
    data: { quotations },
  });
});

const getForRfq = asyncHandler(async (req, res) => {
  const quotations = await quotationService.getQuotationsForRfq(req.params.rfqId, req.user.id);
  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Quotations fetched successfully',
    data: { quotations },
  });
});

const update = asyncHandler(async (req, res) => {
  const quotation = await quotationService.updateQuotation(req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, { message: 'Quotation updated successfully', data: { quotation } });
});

const accept = asyncHandler(async (req, res) => {
  const quotation = await quotationService.updateQuotationStatus(req.params.id, req.user.id, 'accepted');
  return ApiResponse.success(res, { message: 'Quotation accepted successfully', data: { quotation } });
});

const close = asyncHandler(async (req, res) => {
  const quotation = await quotationService.updateQuotationStatus(req.params.id, req.user.id, 'closed');
  return ApiResponse.success(res, { message: 'Quotation rejected successfully', data: { quotation } });
});

export default { submit, getMyQuotations, getForRfq, update, accept, close };