import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { pool } from '../db/pool.js';
import { getHouseholdIdForUser } from '../utils/household.js';

export const expensesRouter = express.Router();

const createSchema = z.object({
  name: z.string().min(1),
  amount_cents: z.number().int().nonnegative(),
  frequency: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'yearly']),
  due_day_of_month: z.number().int().min(1).max(31).optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  autopay: z.boolean().optional(),
  category: z.string().optional(),
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

expensesRouter.get('/', requireAuth, async (req, res) => {
  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const result = await pool.query(
    `select * from expenses
     where household_id = $1 and active = true
     order by created_at desc`,
    [householdId]
  );

  return res.json({ items: result.rows });
});

expensesRouter.post('/', requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const data = parsed.data;
  const targetUserId = data.user_id === null ? null : req.user.user_id;

  const result = await pool.query(
    `insert into expenses
      (household_id, user_id, name, amount_cents, frequency, due_day_of_month, start_date, end_date, autopay, category)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     returning *`,
    [
      householdId,
      targetUserId,
      data.name,
      data.amount_cents,
      data.frequency,
      data.due_day_of_month || null,
      data.start_date,
      data.end_date || null,
      data.autopay || false,
      data.category || null,
    ]
  );

  return res.status(201).json({ item: result.rows[0] });
});

expensesRouter.patch('/:id', requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const expenseId = req.params.id;
  const existing = await pool.query(
    'select id from expenses where id = $1 and household_id = $2 and active = true',
    [expenseId, householdId]
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
  if (Object.prototype.hasOwnProperty.call(data, 'amount_cents'))
    addField('amount_cents', data.amount_cents);
  if (Object.prototype.hasOwnProperty.call(data, 'frequency'))
    addField('frequency', data.frequency);
  if (Object.prototype.hasOwnProperty.call(data, 'due_day_of_month'))
    addField('due_day_of_month', data.due_day_of_month || null);
  if (Object.prototype.hasOwnProperty.call(data, 'start_date')) addField('start_date', data.start_date);
  if (Object.prototype.hasOwnProperty.call(data, 'end_date'))
    addField('end_date', data.end_date || null);
  if (Object.prototype.hasOwnProperty.call(data, 'autopay')) addField('autopay', data.autopay || false);
  if (Object.prototype.hasOwnProperty.call(data, 'category'))
    addField('category', data.category || null);
  if (Object.prototype.hasOwnProperty.call(data, 'user_id')) addField('user_id', data.user_id);

  const query = `update expenses set ${fields.join(', ')} where id = $${idx} returning *`;
  values.push(expenseId);
  const result = await pool.query(query, values);

  return res.json({ item: result.rows[0] });
});

expensesRouter.delete('/:id', requireAuth, async (req, res) => {
  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const expenseId = req.params.id;
  const result = await pool.query(
    `update expenses
     set active = false
     where id = $1 and household_id = $2 and active = true
     returning id`,
    [expenseId, householdId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'not_found' });
  }

  return res.json({ status: 'ok' });
});
