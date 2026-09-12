// src/services/quotation.service.js

import pgPool from '../config/pg.js';
import { createApiError } from '../utils/ApiError.js';

const submitQuotation = async (rfqId, supplierId, payload) => {
  // RFQ must exist and be open
  const rfqResult = await pgPool.query(
    'SELECT id, status, buyer_id FROM rfqs WHERE id = $1 LIMIT 1',
    [rfqId]
  );

  const rfq = rfqResult.rows[0];
  if (!rfq) throw createApiError(404, 'RFQ not found');
  if (rfq.status !== 'open') throw createApiError(400, 'This RFQ is closed for quotations');

  try {
    const insertResult = await pgPool.query(
      `INSERT INTO quotations (rfq_id, supplier_id, price, delivery_time, message, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING *`,
      [rfqId, supplierId, payload.price, payload.delivery_time, payload.message || null]
    );

    return insertResult.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw createApiError(409, 'You have already submitted a quotation for this RFQ');
    }
    throw createApiError(500, 'Failed to submit quotation', error.message);
  }
};

// Supplier's own submitted quotations
const getMyQuotations = async (supplierId) => {
  const result = await pgPool.query(
    `SELECT q.*, r.product_name, r.delivery_location, r.deadline, r.status AS rfq_status
     FROM quotations q
     LEFT JOIN rfqs r ON r.id = q.rfq_id
     WHERE q.supplier_id = $1
     ORDER BY q.created_at DESC`,
    [supplierId]
  );

  return result.rows;
};

// Buyer viewing quotations received on one of their RFQs
const getQuotationsForRfq = async (rfqId, buyerId) => {
  const rfqResult = await pgPool.query(
    'SELECT id, buyer_id FROM rfqs WHERE id = $1 LIMIT 1',
    [rfqId]
  );

  const rfq = rfqResult.rows[0];
  if (!rfq) throw createApiError(404, 'RFQ not found');
  if (rfq.buyer_id !== buyerId) {
    throw createApiError(403, 'You do not have permission to view these quotations');
  }

  const result = await pgPool.query(
    `SELECT q.*, u.name AS supplier_name, u.company_name AS supplier_company_name, u.email AS supplier_email
     FROM quotations q
     LEFT JOIN users u ON u.id = q.supplier_id
     WHERE q.rfq_id = $1
     ORDER BY q.price ASC`,
    [rfqId]
  );

  return result.rows;
};

const updateQuotation = async (quotationId, supplierId, payload) => {
  const fields = [];
  const values = [quotationId, supplierId];

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    fields.push(`${key} = $${values.length + 1}`);
    values.push(value);
  }
  if (!fields.length) throw createApiError(400, 'At least one quotation field is required');
  fields.push('updated_at = NOW()');

  const result = await pgPool.query(
    `UPDATE quotations SET ${fields.join(', ')}
     FROM rfqs
     WHERE quotations.id = $1 AND quotations.supplier_id = $2
      AND rfqs.id = quotations.rfq_id 
      
     RETURNING *`,
    values
  );
  if (!result.rows[0]) {
    const existing = await pgPool.query(
      `SELECT q.id, q.supplier_id, r.status AS rfq_status
       FROM quotations q JOIN rfqs r ON r.id = q.rfq_id WHERE q.id = $1`,
      [quotationId]
    );
    if (!existing.rows[0]) throw createApiError(404, 'Quotation not found');
    if (existing.rows[0].supplier_id !== supplierId) throw createApiError(403, 'You do not have permission to edit this quotation');
    if (existing.rows[0].rfq_status !== 'open') {
      throw createApiError(400, `Quotations cannot be edited after the RFQ is ${existing.rows[0].rfq_status}`);
    }
    throw createApiError(400, 'Only open quotations can be edited');
  }
  return result.rows[0];
};

const updateQuotationStatus = async (quotationId, buyerId, status) => {
  if (status === 'accepted') {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const quoteResult = await client.query(
        `SELECT q.*, r.buyer_id, r.status AS rfq_status
         FROM quotations q JOIN rfqs r ON r.id = q.rfq_id
         WHERE q.id = $1 FOR UPDATE`,
        [quotationId]
      );
      const quote = quoteResult.rows[0];
      if (!quote) throw createApiError(404, 'Quotation not found');
      if (quote.buyer_id !== buyerId) throw createApiError(403, 'You do not have permission to update this quotation');
      if (quote.rfq_status !== 'open') throw createApiError(400, 'Only quotations on open RFQs can be accepted');
      if (quote.status !== 'open') throw createApiError(400, 'Only open quotations can be accepted');

      await client.query(
        `UPDATE quotations SET status = 'closed', updated_at = NOW()
         WHERE rfq_id = $1 AND id <> $2 AND status = 'open'`,
        [quote.rfq_id, quotationId]
      );
      const accepted = await client.query(
        `UPDATE quotations SET status = 'accepted', updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [quotationId]
      );
      const rfq = await client.query(
        `UPDATE rfqs SET status = 'accepted', updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [quote.rfq_id]
      );
      await client.query('COMMIT');
      return { quotation: accepted.rows[0], rfq: rfq.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  const result = await pgPool.query(
    `UPDATE quotations q SET status = $1, updated_at = NOW()
     FROM rfqs r
     WHERE q.id = $2 AND q.rfq_id = r.id AND r.buyer_id = $3
       AND r.status = 'open' AND q.status = 'open'
     RETURNING q.*`,
    [status, quotationId, buyerId]
  );
  if (result.rows[0]) return result.rows[0];

  const existing = await pgPool.query(
    `SELECT q.id, q.status, r.buyer_id FROM quotations q JOIN rfqs r ON r.id = q.rfq_id WHERE q.id = $1`,
    [quotationId]
  );
  if (!existing.rows[0]) throw createApiError(404, 'Quotation not found');
  if (existing.rows[0].buyer_id !== buyerId) throw createApiError(403, 'You do not have permission to update this quotation');
  throw createApiError(400, 'Only open quotations can be updated');
};

export default { submitQuotation, getMyQuotations, getQuotationsForRfq, updateQuotation, updateQuotationStatus };