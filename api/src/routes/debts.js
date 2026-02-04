import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { pool } from '../db/pool.js';
import { getHouseholdIdForUser } from '../utils/household.js';

export const debtsRouter = express.Router();

const createSchema = z.object({
  name: z.string().min(1),
  lender: z.string().min(1).optional(),
  original_principal_cents: z.number().int().nonnegative(),
  current_balance_cents: z.number().int().nonnegative(),
  interest_rate_apr: z.number().nonnegative(),
  promo_rate_apr: z.number().nonnegative().optional(),
  promo_rate_end_date: z.string().optional(),
  compounding: z.string().min(1).optional(),
  minimum_payment_cents: z.number().int().nonnegative(),
  due_day_of_month: z.number().int().min(1).max(31).optional(),
  start_date: z.string(),
  user_id: z.string().uuid().nullable().optional(),
});

const updateSchema = createSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'at_least_one_field_required' }
);

async function assertHouseholdMember(householdId, userId) {
  const result = await pool.query(
    'select 1 from household_members where household_id = $1 and user_id = $2',
    [householdId, userId]
  );
  return result.rowCount > 0;
}

debtsRouter.get('/', requireAuth, async (req, res) => {
  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const userId = req.query.user_id;
  if (userId) {
    const ok = await assertHouseholdMember(householdId, userId);
    if (!ok) {
      return res.status(403).json({ error: 'invalid_user' });
    }
  }

  const query = userId
    ? 'select * from debts where household_id = $1 and user_id = $2 and active = true order by created_at desc'
    : 'select * from debts where household_id = $1 and active = true order by created_at desc';
  const params = userId ? [householdId, userId] : [householdId];
  const result = await pool.query(query, params);

  return res.json({ items: result.rows });
});

debtsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const data = parsed.data;
  let targetUserId = req.user.user_id;
  if (data.user_id === null) {
    targetUserId = null;
  } else if (data.user_id) {
    const ok = await assertHouseholdMember(householdId, data.user_id);
    if (!ok) {
      return res.status(403).json({ error: 'invalid_user' });
    }
    targetUserId = data.user_id;
  }

  const result = await pool.query(
    `insert into debts
      (household_id, user_id, name, lender, original_principal_cents, current_balance_cents,
       interest_rate_apr, promo_rate_apr, promo_rate_end_date, compounding, minimum_payment_cents, due_day_of_month, start_date)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     returning *`,
    [
      householdId,
      targetUserId,
      data.name,
      data.lender || null,
      data.original_principal_cents,
      data.current_balance_cents,
      data.interest_rate_apr,
      data.promo_rate_apr || 0,
      data.promo_rate_end_date || null,
      data.compounding || 'monthly',
      data.minimum_payment_cents,
      data.due_day_of_month || null,
      data.start_date,
    ]
  );

  return res.status(201).json({ item: result.rows[0] });
});

debtsRouter.patch('/:id', requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const debtId = req.params.id;
  const existing = await pool.query(
    'select id from debts where id = $1 and household_id = $2 and active = true',
    [debtId, householdId]
  );
  if (existing.rowCount === 0) {
    return res.status(404).json({ error: 'not_found' });
  }

  const data = parsed.data;
  if (Object.prototype.hasOwnProperty.call(data, 'user_id') && data.user_id) {
    const ok = await assertHouseholdMember(householdId, data.user_id);
    if (!ok) {
      return res.status(403).json({ error: 'invalid_user' });
    }
  }

  const fields = [];
  const values = [];
  let idx = 1;

  const addField = (column, value) => {
    fields.push(`${column} = $${idx}`);
    values.push(value);
    idx += 1;
  };

  if (Object.prototype.hasOwnProperty.call(data, 'name')) addField('name', data.name);
  if (Object.prototype.hasOwnProperty.call(data, 'lender')) addField('lender', data.lender || null);
  if (Object.prototype.hasOwnProperty.call(data, 'original_principal_cents'))
    addField('original_principal_cents', data.original_principal_cents);
  if (Object.prototype.hasOwnProperty.call(data, 'current_balance_cents'))
    addField('current_balance_cents', data.current_balance_cents);
  if (Object.prototype.hasOwnProperty.call(data, 'interest_rate_apr'))
    addField('interest_rate_apr', data.interest_rate_apr);
  if (Object.prototype.hasOwnProperty.call(data, 'promo_rate_apr'))
    addField('promo_rate_apr', data.promo_rate_apr || 0);
  if (Object.prototype.hasOwnProperty.call(data, 'promo_rate_end_date'))
    addField('promo_rate_end_date', data.promo_rate_end_date || null);
  if (Object.prototype.hasOwnProperty.call(data, 'compounding'))
    addField('compounding', data.compounding || 'monthly');
  if (Object.prototype.hasOwnProperty.call(data, 'minimum_payment_cents'))
    addField('minimum_payment_cents', data.minimum_payment_cents);
  if (Object.prototype.hasOwnProperty.call(data, 'due_day_of_month'))
    addField('due_day_of_month', data.due_day_of_month || null);
  if (Object.prototype.hasOwnProperty.call(data, 'start_date')) addField('start_date', data.start_date);
  if (Object.prototype.hasOwnProperty.call(data, 'user_id')) addField('user_id', data.user_id);

  const query = `update debts set ${fields.join(', ')} where id = $${idx} returning *`;
  values.push(debtId);
  const result = await pool.query(query, values);

  return res.json({ item: result.rows[0] });
});

debtsRouter.delete('/:id', requireAuth, async (req, res) => {
  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const debtId = req.params.id;
  const result = await pool.query(
    `update debts
     set active = false
     where id = $1 and household_id = $2 and active = true
     returning id`,
    [debtId, householdId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'not_found' });
  }

  return res.json({ status: 'ok' });
});
