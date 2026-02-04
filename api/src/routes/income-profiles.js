import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { pool } from '../db/pool.js';
import { getHouseholdIdForUser } from '../utils/household.js';

export const incomeRouter = express.Router();

const baseSchema = z.object({
  name: z.string().min(1),
  amount_cents: z.number().int().nonnegative(),
  frequency: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'yearly']),
  start_date: z.string(),
  timezone: z.string().optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  semimonthly_days: z.array(z.number().int().min(1).max(31)).length(2).optional(),
});

const createSchema = baseSchema.superRefine((data, ctx) => {
    if (data.frequency === 'semimonthly' && !data.semimonthly_days) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'semimonthly_days_required',
        path: ['semimonthly_days'],
      });
    }

    if (['monthly', 'quarterly', 'yearly'].includes(data.frequency) && !data.day_of_month) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'day_of_month_required',
        path: ['day_of_month'],
      });
    }
  });

const updateSchema = baseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'at_least_one_field_required' }
);

incomeRouter.get('/', requireAuth, async (req, res) => {
  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const result = await pool.query(
    'select * from income_profiles where household_id = $1 and user_id = $2 and active = true order by created_at desc',
    [householdId, req.user.user_id]
  );

  return res.json({ items: result.rows });
});

incomeRouter.post('/', requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const data = parsed.data;
  const result = await pool.query(
    `insert into income_profiles
      (household_id, user_id, name, amount_cents, frequency, start_date, timezone, day_of_month, semimonthly_days)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     returning *`,
    [
      householdId,
      req.user.user_id,
      data.name,
      data.amount_cents,
      data.frequency,
      data.start_date,
      data.timezone || 'America/New_York',
      data.day_of_month || null,
      data.semimonthly_days || null,
    ]
  );

  return res.status(201).json({ item: result.rows[0] });
});

incomeRouter.patch('/:id', requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const profileId = req.params.id;
  const existing = await pool.query(
    'select id from income_profiles where id = $1 and household_id = $2 and active = true',
    [profileId, householdId]
  );
  if (existing.rowCount === 0) {
    return res.status(404).json({ error: 'not_found' });
  }

  const data = parsed.data;
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
  if (Object.prototype.hasOwnProperty.call(data, 'start_date')) addField('start_date', data.start_date);
  if (Object.prototype.hasOwnProperty.call(data, 'timezone'))
    addField('timezone', data.timezone || 'America/New_York');
  if (Object.prototype.hasOwnProperty.call(data, 'day_of_month'))
    addField('day_of_month', data.day_of_month || null);
  if (Object.prototype.hasOwnProperty.call(data, 'semimonthly_days'))
    addField('semimonthly_days', data.semimonthly_days || null);

  const query = `update income_profiles set ${fields.join(', ')} where id = $${idx} returning *`;
  values.push(profileId);
  const result = await pool.query(query, values);

  return res.json({ item: result.rows[0] });
});

incomeRouter.delete('/:id', requireAuth, async (req, res) => {
  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const profileId = req.params.id;
  const result = await pool.query(
    `update income_profiles
     set active = false
     where id = $1 and household_id = $2 and active = true
     returning id`,
    [profileId, householdId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'not_found' });
  }

  return res.json({ status: 'ok' });
});
