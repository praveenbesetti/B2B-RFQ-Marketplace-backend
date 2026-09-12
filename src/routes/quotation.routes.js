// src/routes/quotation.routes.js

import express from 'express';
const router = express.Router();
import quotationController from '../controllers/quotation.controller.js';
import validate from '../middleware/validate.middleware.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { createQuotationSchema, updateQuotationSchema } from '../validators/quotation.validator.js';

router.use(authenticate);

// Supplier submits a quote on an RFQ
router.post(
  '/rfq/:rfqId',
  authorize('supplier'),
  validate(createQuotationSchema),
  quotationController.submit
);

router.patch('/:id', authorize('supplier'), validate(updateQuotationSchema), quotationController.update);
router.post('/:id/accept', authorize('buyer'), quotationController.accept);
router.post('/:id/close', authorize('buyer'), quotationController.close);

// Supplier views their own submitted quotations
router.get('/mine', authorize('supplier'), quotationController.getMyQuotations);

// Buyer views quotations received on a specific RFQ they own
router.get('/rfq/:rfqId', authorize('buyer'), quotationController.getForRfq);

export default router;