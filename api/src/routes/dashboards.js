import express from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { pool } from '../db/pool.js';
import { getHouseholdIdForUser } from '../utils/household.js';

export const dashboardsRouter = express.Router();

const monthlyFactor = (frequency) => {
  switch (frequency) {
    case 'weekly':
      return 52 / 12;
    case 'biweekly':
      return 26 / 12;
    case 'semimonthly':
      return 2;
    case 'monthly':
      return 1;
    case 'quarterly':
      return 1 / 3;
    case 'yearly':
      return 1 / 12;
    default:
      return 1;
  }
};

async function getDashboardData({ householdId, userId, includeShared }) {
  const incomeQuery = includeShared
    ? 'select amount_cents, frequency from income_profiles where household_id = $1 and active = true'
    : 'select amount_cents, frequency from income_profiles where household_id = $1 and user_id = $2 and active = true';
  const incomeParams = includeShared ? [householdId] : [householdId, userId];
  const incomes = await pool.query(incomeQuery, incomeParams);

  const expensesQuery = includeShared
    ? 'select amount_cents, frequency from expenses where household_id = $1 and active = true'
    : 'select amount_cents, frequency from expenses where household_id = $1 and user_id = $2 and active = true';
  const expensesParams = includeShared ? [householdId] : [householdId, userId];
  const expenses = await pool.query(expensesQuery, expensesParams);

  const debtsQuery = includeShared
    ? 'select current_balance_cents, minimum_payment_cents from debts where household_id = $1 and active = true'
    : 'select current_balance_cents, minimum_payment_cents from debts where household_id = $1 and user_id = $2 and active = true';
  const debtsParams = includeShared ? [householdId] : [householdId, userId];
  const debts = await pool.query(debtsQuery, debtsParams);

  const incomeMonthly = incomes.rows.reduce(
    (sum, row) => sum + Math.round(Number(row.amount_cents) * monthlyFactor(row.frequency)),
    0
  );
  const expensesMonthly = expenses.rows.reduce(
    (sum, row) => sum + Math.round(Number(row.amount_cents) * monthlyFactor(row.frequency)),
    0
  );
  const debtBalance = debts.rows.reduce((sum, row) => sum + Number(row.current_balance_cents), 0);
  const minDebtPayment = debts.rows.reduce(
    (sum, row) => sum + Number(row.minimum_payment_cents),
    0
  );

  const estimatedMonths =
    minDebtPayment > 0 ? Math.ceil(debtBalance / minDebtPayment) : null;

  return {
    income_monthly_cents: incomeMonthly,
    expenses_monthly_cents: expensesMonthly,
    debt_balance_cents: debtBalance,
    minimum_debt_payment_cents: minDebtPayment,
    estimated_months_to_payoff: estimatedMonths,
    timeline: [],
  };
}

dashboardsRouter.get('/user', requireAuth, async (req, res) => {
  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const data = await getDashboardData({
    householdId,
    userId: req.user.user_id,
    includeShared: false,
  });

  return res.json(data);
});

dashboardsRouter.get('/home', requireAuth, async (req, res) => {
  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const data = await getDashboardData({
    householdId,
    userId: req.user.user_id,
    includeShared: true,
  });

  return res.json(data);
});
