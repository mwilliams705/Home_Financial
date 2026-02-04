# Home_Financial Data Model (v0)

## Goals
- Multi-user sign-in with private user dashboards and shared "Home" dashboards.
- Show paydays and recurring expenses on a calendar.
- Model debts with interest for payment planning (avalanche/snowball).

## Core Entities
- `users`: Login identities.
- `households`: Shared "Home" scope for you and your wife.
- `household_members`: Memberships with roles.
- `income_profiles`: Compensation inputs and payday rules.
- `expenses`: Recurring bills (monthly or other frequencies).
- `debts`: Loan/credit accounts with APR and minimums.
- `payment_plans` + `payment_plan_items`: Planned payments per pay date.
- `debt_payments`: Actual recorded payments (optional in early UI).

## Privacy Model
- User dashboards: filter by `user_id`.
- Home dashboard: aggregate by `household_id`.
- Shared items: set `user_id` to `NULL` for household-wide expenses/debts.

## Recurrence Rules (Simplified)
- `frequency` enum: weekly, biweekly, semimonthly, monthly, quarterly, yearly.
- `income_profiles`:
  - `start_date` anchors the schedule.
  - `day_of_month` used for monthly/quarterly/yearly.
  - `semimonthly_days` used for semimonthly (e.g., [1, 15]).

## Payment Planning
- `payment_plans` store strategy per user and month.
- `payment_plan_items` hold computed amounts per debt per pay date.
- Early UI can compute in memory without persisting; the table enables later “save plan”.

## Currency
- Single currency per household.
- `households.currency` defaults to `USD`.

## Next Step Suggestions
- Decide if we want a proper recurrence table (RRULE) or keep the simplified fields.
