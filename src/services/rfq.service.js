// src/services/rfq.service.js

import pgPool from '../config/pg.js';
import { createApiError } from '../utils/ApiError.js';

const createRfq = async (buyerId, payload) => {
  const { product_name, description, quantity, delivery_location, deadline } = payload;
  const result = await pgPool.query(
    `INSERT INTO rfqs (buyer_id, product_name, description, quantity, delivery_location, deadline, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'open')
     RETURNING *`,
    [buyerId, product_name, description, quantity, delivery_location, deadline]
  );

  return result.rows[0];
};

// Buyer's own RFQs (dashboard view)
const getMyRfqs = async (buyerId) => {
  const result = await pgPool.query(
    'SELECT * FROM rfqs WHERE buyer_id = $1 ORDER BY created_at DESC',
    [buyerId]
  );

  return result.rows;
};

// Supplier browse view — open RFQs, with search + pagination
const browseRfqs = async ({ search, status, page, limit, supplierId }) => {
  const offset = (page - 1) * limit;

  const values = [supplierId];
  let index = 2;
  const filters = ['(r.status = \'open\' OR q.id IS NOT NULL)'];

  if (search) {
    const term = `%${search}%`;
    filters.push(`r.product_name ILIKE $${index}`);
    values.push(term);
    index += 1;
  }

  const whereClause = filters.join(' AND ');
  const listQuery = `
    SELECT r.*, q.id AS quotation_id
    FROM rfqs r
    LEFT JOIN quotations q ON q.rfq_id = r.id AND q.supplier_id = $1
    WHERE ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT $${index} OFFSET $${index + 1}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM rfqs r
    LEFT JOIN quotations q ON q.rfq_id = r.id AND q.supplier_id = $1
    WHERE ${whereClause}
  `;

  const countResult = await pgPool.query(countQuery, values);
  const listResult = await pgPool.query(listQuery, [...values, limit, offset]);

  const total = countResult.rows[0]?.total || 0;

  return {
    rfqs: listResult.rows,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getRfqById = async (rfqId, viewer) => {
  const result = await pgPool.query(
    `SELECT rfqs.*, users.name AS buyer_name, users.company_name AS buyer_company_name,
       COALESCE(quotation_data.quotations, '[]'::json) AS quotations
     FROM rfqs
     LEFT JOIN users ON users.id = rfqs.buyer_id
     LEFT JOIN LATERAL (
       SELECT json_agg(
         json_build_object(
           'id', q.id,
           'rfq_id', q.rfq_id,
           'supplier_id', q.supplier_id,
           'price', q.price,
           'delivery_time', q.delivery_time,
           'message', q.message,
           'status', q.status,
           'created_at', q.created_at,
           'updated_at', q.updated_at,
           'supplier_name', supplier.name,
           'supplier_company_name', supplier.company_name,
           'supplier_email', supplier.email
         ) ORDER BY q.price ASC
       ) AS quotations
       FROM quotations q
       LEFT JOIN users supplier ON supplier.id = q.supplier_id
       WHERE q.rfq_id = rfqs.id
         AND ($2 = 'buyer' OR q.supplier_id = $3)
     ) quotation_data ON TRUE
     WHERE rfqs.id = $1 LIMIT 1`,
    [rfqId, viewer?.role || 'supplier', viewer?.id || null]
  );

  const data = result.rows[0];
  if (!data) throw createApiError(404, 'RFQ not found');
  return data;
};

const getBuyerRfqById = async (rfqId, buyerId) => {
  const ownership = await pgPool.query(
    'SELECT id FROM rfqs WHERE id = $1 AND buyer_id = $2 LIMIT 1',
    [rfqId, buyerId]
  );
  if (!ownership.rows[0]) throw createApiError(404, 'RFQ not found');
  return getRfqById(rfqId, { id: buyerId, role: 'buyer' });
};

const getSupplierRfqById = async (rfqId, supplierId) => {
  return getRfqById(rfqId, { id: supplierId, role: 'supplier' });
};

const updateRfq = async (rfqId, buyerId, payload) => {
  // Ownership check first — don't let a buyer edit someone else's RFQ
  const existingResult = await pgPool.query(
    'SELECT id, buyer_id, status FROM rfqs WHERE id = $1 LIMIT 1',
    [rfqId]
  );

  const existing = existingResult.rows[0];

  if (!existing) throw createApiError(404, 'RFQ not found');
  if (existing.buyer_id !== buyerId) {
    throw createApiError(403, 'You do not have permission to edit this RFQ');
  }
  if (existing.status !== 'open') {
    throw createApiError(400, `RFQs cannot be edited after they are ${existing.status}`);
  }

  const fields = [];
  const values = [rfqId];

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    fields.push(`${key} = $${values.length + 1}`);
    values.push(value);
  }

  if (!fields.length) {
    return existing;
  }

  fields.push(`updated_at = NOW()`);

  const updateQuery = `UPDATE rfqs SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
  const result = await pgPool.query(updateQuery, values);

  return result.rows[0];
};

const closeRfq = async (rfqId, buyerId) => {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE rfqs SET status = 'closed', updated_at = NOW()
       WHERE id = $1 AND buyer_id = $2 AND status = 'open' RETURNING *`,
      [rfqId, buyerId]
    );
    if (!result.rows[0]) throw createApiError(400, 'Only open RFQs owned by you can be closed');
    await client.query(`UPDATE quotations SET status = 'closed', updated_at = NOW() WHERE rfq_id = $1 AND status = 'open'`, [rfqId]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
};

const acceptQuotation = async (rfqId, buyerId, quotationId) => {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const rfqResult = await client.query(
      `SELECT id, buyer_id, status FROM rfqs WHERE id = $1 FOR UPDATE`,
      [rfqId]
    );
    const rfq = rfqResult.rows[0];
    if (!rfq) throw createApiError(404, 'RFQ not found');
    if (rfq.buyer_id !== buyerId) throw createApiError(403, 'You do not have permission to accept a quotation');
    if (rfq.status !== 'open') throw createApiError(400, 'Only open RFQs can accept a quotation');

    const quoteResult = await client.query(
      `SELECT * FROM quotations WHERE id = $1 AND rfq_id = $2`,
      [quotationId, rfqId]
    );
    if (!quoteResult.rows[0]) throw createApiError(404, 'Quotation not found for this RFQ');
    await client.query(`UPDATE quotations SET status = 'closed', updated_at = NOW() WHERE rfq_id = $1 AND id <> $2 AND status = 'open'`, [rfqId, quotationId]);
    await client.query(`UPDATE quotations SET status = 'accepted', updated_at = NOW() WHERE id = $1`, [quotationId]);
    const updatedRfq = await client.query(
      `UPDATE rfqs SET status = 'accepted', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [rfqId]
    );
    await client.query('COMMIT');
    return { rfq: updatedRfq.rows[0], quotation: quoteResult.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default { createRfq, getMyRfqs, browseRfqs, getRfqById, getBuyerRfqById, getSupplierRfqById, updateRfq, closeRfq, acceptQuotation };