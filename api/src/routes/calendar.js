import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { pool } from '../db/pool.js';
import { getHouseholdIdForUser } from '../utils/household.js';

export const calendarRouter = express.Router();

const querySchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
  user_id: z.string().uuid().optional(),
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDate = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const daysInMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const clampDay = (year, monthIndex, day) => Math.min(day, daysInMonth(year, monthIndex));

const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);

const addMonthsUtc = (date, months) => {
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const day = date.getUTCDate();
  const targetMonth = monthIndex + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const clampedDay = clampDay(targetYear, normalizedMonth, day);
  return new Date(Date.UTC(targetYear, normalizedMonth, clampedDay));
};

const withinRange = (date, start, end) => date >= start && date <= end;

const expandWeekly = (startDate, endDate, intervalWeeks) => {
  const occurrences = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    occurrences.push(new Date(cursor.getTime()));
    cursor = addDays(cursor, 7 * intervalWeeks);
  }
  return occurrences;
};

const expandMonthlyByDay = (anchorDate, start, end, intervalMonths, dayOverride) => {
  const occurrences = [];
  let cursor = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), 1));
  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const monthIndex = cursor.getUTCMonth();
    const day = dayOverride || anchorDate.getUTCDate();
    const actualDay = clampDay(year, monthIndex, day);
    const candidate = new Date(Date.UTC(year, monthIndex, actualDay));
    if (candidate >= anchorDate && withinRange(candidate, start, end)) {
      occurrences.push(candidate);
    }
    cursor = addMonthsUtc(cursor, intervalMonths);
  }
  return occurrences;
};

const expandSemimonthly = (anchorDate, start, end, days) => {
  const occurrences = [];
  let cursor = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), 1));
  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const monthIndex = cursor.getUTCMonth();
    for (const day of days) {
      const actualDay = clampDay(year, monthIndex, day);
      const candidate = new Date(Date.UTC(year, monthIndex, actualDay));
      if (candidate >= anchorDate && withinRange(candidate, start, end)) {
        occurrences.push(candidate);
      }
    }
    cursor = addMonthsUtc(cursor, 1);
  }
  occurrences.sort((a, b) => a - b);
  return occurrences;
};

const expandRecurring = (record, start, end, dateField, dayOverride, semimonthlyOverride) => {
  const anchor = toDate(record[dateField]);
  if (!anchor) return [];
  if (anchor > end) return [];

  switch (record.frequency) {
    case 'weekly':
      return expandWeekly(anchor, end, 1);
    case 'biweekly':
      return expandWeekly(anchor, end, 2);
    case 'semimonthly':
      return expandSemimonthly(anchor, start, end, semimonthlyOverride || record.semimonthly_days || []);
    case 'monthly':
      return expandMonthlyByDay(anchor, start, end, 1, dayOverride);
    case 'quarterly':
      return expandMonthlyByDay(anchor, start, end, 3, dayOverride);
    case 'yearly':
      return expandMonthlyByDay(anchor, start, end, 12, dayOverride);
    default:
      return [];
  }
};

calendarRouter.get('/', requireAuth, async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const { start, end, user_id } = parsed.data;
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate || startDate > endDate) {
    return res.status(400).json({ error: 'invalid_request', details: { start, end } });
  }

  if (user_id) {
    const member = await pool.query(
      'select 1 from household_members where household_id = $1 and user_id = $2',
      [householdId, user_id]
    );
    if (member.rowCount === 0) {
      return res.status(403).json({ error: 'invalid_user' });
    }
  }

  const paydays = await pool.query(
    `select * from income_profiles
     where household_id = $1
       and active = true
       and start_date <= $2
       ${user_id ? 'and user_id = $3' : ''}`,
    user_id ? [householdId, end, user_id] : [householdId, end]
  );

  const expenses = await pool.query(
    `select * from expenses
     where household_id = $1
       and active = true
       and start_date <= $2
       and (end_date is null or end_date >= $3)
       ${user_id ? 'and (user_id = $4 or user_id is null)' : ''}`,
    user_id ? [householdId, end, start, user_id] : [householdId, end, start]
  );

  const debts = await pool.query(
    `select * from debts
     where household_id = $1
       and active = true
       ${user_id ? 'and (user_id = $2 or user_id is null)' : ''}`,
    user_id ? [householdId, user_id] : [householdId]
  );

  const plannedPayments = await pool.query(
    `select ppi.*, pp.user_id, pp.plan_month
     from payment_plan_items ppi
     join payment_plans pp on pp.id = ppi.plan_id
     where pp.household_id = $1
       and ppi.pay_date between $2 and $3`,
    [householdId, start, end]
  );

  const paydayItems = [];
  for (const profile of paydays.rows) {
    const occurrences = expandRecurring(
      profile,
      startDate,
      endDate,
      'start_date',
      profile.day_of_month,
      profile.semimonthly_days
    );
    for (const date of occurrences) {
      if (!withinRange(date, startDate, endDate)) continue;
      paydayItems.push({
        income_profile_id: profile.id,
        name: profile.name,
        amount_cents: profile.amount_cents,
        date: formatDate(date),
        frequency: profile.frequency,
        user_id: profile.user_id,
      });
    }
  }

  const expenseItems = [];
  for (const expense of expenses.rows) {
    const occurrences = expandRecurring(
      expense,
      startDate,
      endDate,
      'start_date',
      expense.due_day_of_month,
      expense.semimonthly_days || [1, 15]
    );
    for (const date of occurrences) {
      if (!withinRange(date, startDate, endDate)) continue;
      expenseItems.push({
        expense_id: expense.id,
        name: expense.name,
        amount_cents: expense.amount_cents,
        date: formatDate(date),
        frequency: expense.frequency,
        category: expense.category,
        autopay: expense.autopay,
        user_id: expense.user_id,
      });
    }
  }

  const debtItems = [];
  for (const debt of debts.rows) {
    const dueDay = debt.due_day_of_month || new Date(debt.start_date).getUTCDate();
    const occurrences = expandMonthlyByDay(
      toDate(debt.start_date),
      startDate,
      endDate,
      1,
      dueDay
    );
    for (const date of occurrences) {
      if (!withinRange(date, startDate, endDate)) continue;
      debtItems.push({
        debt_id: debt.id,
        name: debt.name,
        minimum_payment_cents: debt.minimum_payment_cents,
        date: formatDate(date),
        user_id: debt.user_id,
      });
    }
  }

  return res.json({
    range: { start, end },
    paydays: paydayItems,
    expenses: expenseItems,
    debts: debtItems,
    planned_payments: plannedPayments.rows,
  });
});
