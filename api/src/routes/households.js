import express from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { pool } from '../db/pool.js';

export const householdRouter = express.Router();

householdRouter.get('/me', requireAuth, async (req, res) => {
  const { user_id } = req.user;

  const membership = await pool.query(
    'select household_id, role from household_members where user_id = $1 limit 1',
    [user_id]
  );

  if (membership.rowCount === 0) {
    return res.status(404).json({ error: 'no_household' });
  }

  const householdId = membership.rows[0].household_id;
  const householdResult = await pool.query(
    'select id, name, currency, share_code from households where id = $1',
    [householdId]
  );

  const members = await pool.query(
    `select hm.user_id, hm.role, u.full_name
     from household_members hm
     join users u on u.id = hm.user_id
     where hm.household_id = $1`,
    [householdId]
  );

  return res.json({
    household: householdResult.rows[0],
    members: members.rows,
    current_user_id: user_id,
  });
});

householdRouter.post('/invite', requireAuth, (_req, res) => {
  return res.status(501).json({ error: 'not_implemented' });
});

householdRouter.post('/join', requireAuth, async (req, res) => {
  const { code } = req.body || {};
  if (!code || String(code).length !== 6) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const householdResult = await pool.query(
    'select id, name, currency, share_code from households where share_code = $1',
    [String(code)]
  );
  if (householdResult.rowCount === 0) {
    return res.status(404).json({ error: 'not_found' });
  }

  const householdId = householdResult.rows[0].id;
  await pool.query(
    `insert into household_members (household_id, user_id, role)
     values ($1, $2, $3)
     on conflict do nothing`,
    [householdId, req.user.user_id, 'member']
  );

  return res.json({ household: householdResult.rows[0] });
});
