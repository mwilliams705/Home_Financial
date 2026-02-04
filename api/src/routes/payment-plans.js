import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { pool } from '../db/pool.js';
import { getHouseholdIdForUser } from '../utils/household.js';

export const paymentPlansRouter = express.Router();

const createSchema = z.object({
  plan_month: z.string().min(1),
  strategy: z.string().min(1).optional(),
  extra_amount_cents: z.number().int().nonnegative().optional(),
});

const formatDate = (date) => date.toISOString().slice(0, 10);

const toDate = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const daysInMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const clampDay = (year, monthIndex, day) => Math.min(day, daysInMonth(year, monthIndex));

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

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
    if (candidate >= anchorDate && candidate >= start && candidate <= end) {
      occurrences.push(candidate);
    }
    const nextMonth = monthIndex + intervalMonths;
    const nextYear = year + Math.floor(nextMonth / 12);
    const normalizedMonth = ((nextMonth % 12) + 12) % 12;
    cursor = new Date(Date.UTC(nextYear, normalizedMonth, 1));
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
      if (candidate >= anchorDate && candidate >= start && candidate <= end) {
        occurrences.push(candidate);
      }
    }
    cursor = new Date(Date.UTC(year, monthIndex + 1, 1));
  }
  occurrences.sort((a, b) => a - b);
  return occurrences;
};

const expandRecurring = (record, start, end) => {
  const anchor = toDate(record.start_date);
  if (!anchor || anchor > end) return [];

  switch (record.frequency) {
    case 'weekly':
      return expandWeekly(anchor, end, 1);
    case 'biweekly':
      return expandWeekly(anchor, end, 2);
    case 'semimonthly':
      return expandSemimonthly(anchor, start, end, record.semimonthly_days || []);
    case 'monthly':
      return expandMonthlyByDay(anchor, start, end, 1, record.day_of_month);
    case 'quarterly':
      return expandMonthlyByDay(anchor, start, end, 3, record.day_of_month);
    case 'yearly':
      return expandMonthlyByDay(anchor, start, end, 12, record.day_of_month);
    default:
      return [];
  }
};

paymentPlansRouter.get('/', requireAuth, async (req, res) => {
  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const planMonth = req.query.plan_month;
  const userId = req.query.user_id || req.user.user_id;

  if (req.query.user_id) {
    const membership = await pool.query(
      'select 1 from household_members where household_id = $1 and user_id = $2',
      [householdId, userId]
    );
    if (membership.rowCount === 0) {
      return res.status(403).json({ error: 'invalid_user' });
    }
  }

  if (planMonth) {
    const planMonthDate = toDate(planMonth);
    if (!planMonthDate) {
      return res.status(400).json({ error: 'invalid_request', details: { plan_month: planMonth } });
    }
    const normalizedPlanMonth = formatDate(
      new Date(Date.UTC(planMonthDate.getUTCFullYear(), planMonthDate.getUTCMonth(), 1))
    );
    const plan = await pool.query(
      `select * from payment_plans
       where household_id = $1 and user_id = $2 and plan_month = $3`,
      [householdId, userId, normalizedPlanMonth]
    );
    if (plan.rowCount === 0) {
      return res.json({ plan: null, items: [] });
    }

    const items = await pool.query(
      `select * from payment_plan_items
       where plan_id = $1
       order by pay_date asc`,
      [plan.rows[0].id]
    );

    return res.json({ plan: plan.rows[0], items: items.rows });
  }

  const plans = await pool.query(
    `select * from payment_plans
     where household_id = $1 and user_id = $2
     order by plan_month desc`,
    [householdId, userId]
  );

  return res.json({ items: plans.rows });
});

paymentPlansRouter.post('/', requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const householdId = await getHouseholdIdForUser(req.user.user_id);
  if (!householdId) {
    return res.status(404).json({ error: 'no_household' });
  }

  const data = parsed.data;
  const planMonthDate = toDate(data.plan_month);
  if (!planMonthDate) {
    return res.status(400).json({ error: 'invalid_request', details: { plan_month: data.plan_month } });
  }

  const startOfMonth = new Date(Date.UTC(planMonthDate.getUTCFullYear(), planMonthDate.getUTCMonth(), 1));
  const endOfMonth = new Date(
    Date.UTC(planMonthDate.getUTCFullYear(), planMonthDate.getUTCMonth(), daysInMonth(planMonthDate.getUTCFullYear(), planMonthDate.getUTCMonth()))
  );

  const client = await pool.connect();
  try {
    await client.query('begin');

    const planResult = await client.query(
      `insert into payment_plans (household_id, user_id, plan_month, strategy)
       values ($1,$2,$3,$4)
       on conflict (household_id, user_id, plan_month)
       do update set strategy = excluded.strategy
       returning *`,
      [householdId, req.user.user_id, formatDate(startOfMonth), data.strategy || 'avalanche']
    );

    const planId = planResult.rows[0].id;

    await client.query('delete from payment_plan_items where plan_id = $1', [planId]);

    const debts = await client.query(
      `select * from debts
       where household_id = $1 and active = true`,
      [householdId]
    );

    const incomeProfiles = await client.query(
      `select * from income_profiles
       where household_id = $1 and user_id = $2 and active = true`,
      [householdId, req.user.user_id]
    );

    const payDates = [];
    for (const profile of incomeProfiles.rows) {
      const occurrences = expandRecurring(profile, startOfMonth, endOfMonth);
      for (const date of occurrences) {
        if (date >= startOfMonth && date <= endOfMonth) {
          payDates.push(date);
        }
      }
    }
    payDates.sort((a, b) => a - b);

    const fallbackPayDate = payDates.length > 0 ? payDates[0] : startOfMonth;

    const items = [];
    for (const debt of debts.rows) {
      if (Number(debt.current_balance_cents) <= 0) {
        continue;
      }
      const dueDay = debt.due_day_of_month || new Date(debt.start_date).getUTCDate();
      const dueDate = new Date(
        Date.UTC(
          startOfMonth.getUTCFullYear(),
          startOfMonth.getUTCMonth(),
          clampDay(startOfMonth.getUTCFullYear(), startOfMonth.getUTCMonth(), dueDay)
        )
      );
      const amount = Math.min(Number(debt.current_balance_cents), Number(debt.minimum_payment_cents));
      if (amount <= 0) {
        continue;
      }
      items.push({
        debt_id: debt.id,
        pay_date: formatDate(dueDate),
        amount_cents: amount,
      });
    }

    const extra = data.extra_amount_cents || 0;
    if (extra > 0 && debts.rows.length > 0) {
      const eligibleDebts = debts.rows.filter((debt) => Number(debt.current_balance_cents) > 0);
      if (eligibleDebts.length === 0) {
        await client.query('commit');
        return res.status(201).json({ plan_id: planId, items });
      }
      let target = eligibleDebts[0];
      if ((data.strategy || 'avalanche') === 'snowball') {
        target = eligibleDebts.reduce((best, debt) =>
          Number(debt.current_balance_cents) < Number(best.current_balance_cents) ? debt : best
        );
      } else {
        const effectiveRate = (debt) => {
          if (!debt.promo_rate_end_date) return Number(debt.interest_rate_apr);
          const promoEnd = toDate(debt.promo_rate_end_date);
          if (promoEnd && promoEnd >= startOfMonth) {
            return Number(debt.promo_rate_apr || 0);
          }
          return Number(debt.interest_rate_apr);
        };
        target = eligibleDebts.reduce((best, debt) =>
          effectiveRate(debt) > effectiveRate(best) ? debt : best
        );
      }

      items.push({
        debt_id: target.id,
        pay_date: formatDate(fallbackPayDate),
        amount_cents: extra,
      });
    }

    for (const item of items) {
      await client.query(
        `insert into payment_plan_items (plan_id, debt_id, pay_date, amount_cents)
         values ($1,$2,$3,$4)`,
        [planId, item.debt_id, item.pay_date, item.amount_cents]
      );
    }

    await client.query('commit');
    return res.status(201).json({ plan_id: planId, items });
  } catch (err) {
    await client.query('rollback');
    return res.status(500).json({ error: 'server_error' });
  } finally {
    client.release();
  }
});
