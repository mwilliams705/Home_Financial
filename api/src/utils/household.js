import { pool } from '../db/pool.js';

export async function getHouseholdIdForUser(userId) {
  const result = await pool.query(
    'select household_id from household_members where user_id = $1 limit 1',
    [userId]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0].household_id;
}
