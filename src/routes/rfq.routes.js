// src/routes/rfq.routes.js

import express from 'express';
const router = express.Router();
import rfqController from '../controllers/rfq.controller.js';
import validate from '../middleware/validate.middleware.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/authorize.middleware.js';
import { createRfqSchema, updateRfqSchema, acceptQuotationSchema } from '../validators/rfq.validator.js';

// All RFQ routes require auth
router.use(authenticate);

// Buyer-only
router.post('/', authorize('buyer'), validate(createRfqSchema), rfqController.create);
router.get('/mine', authorize('buyer'), rfqController.getMyRfqs);
router.patch('/:id', authorize('buyer'), validate(updateRfqSchema), rfqController.update);
router.post('/:id/close', authorize('buyer'), rfqController.close);
router.post('/:id/accept', authorize('buyer'), validate(acceptQuotationSchema), rfqController.accept);

// Supplier-only browse (buyers don't need to "discover" — they see their own via /mine)
router.get('/', authorize('supplier'), rfqController.browse);

// Buyers get all quotations linked to their own RFQ.
router.get('/buyer/:id', authorize('buyer'), rfqController.getOneForBuyer);

// Suppliers get only their own quotation for any RFQ they browse.
router.get('/supplier/:id', authorize('supplier'), rfqController.getOneForSupplier);

export default router;