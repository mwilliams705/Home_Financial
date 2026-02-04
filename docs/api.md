# Home_Financial API Design (v0)

## Overview
- Base path: `/api`
- Auth: session-based or JWT (v0 recommends JWT with refresh)
- All requests/rows scoped by `household_id` and/or `user_id`
- Money stored as integer cents

## Auth
### POST /auth/register
Create user and optionally create a household.

Request
```json
{
  "email": "alex@example.com",
  "password": "...",
  "full_name": "Alex",
  "household_name": "Home" 
}
```
Response
```json
{
  "user": {"id": "...", "email": "...", "full_name": "..."},
  "household": {"id": "...", "name": "Home", "currency": "USD"},
  "tokens": {"access": "...", "refresh": "..."}
}
```

### POST /auth/login
Request
```json
{ "email": "alex@example.com", "password": "..." }
```
Response
```json
{ "tokens": {"access": "...", "refresh": "..."} }
```

### POST /auth/refresh
Request
```json
{ "refresh": "..." }
```
Response
```json
{ "access": "..." }
```

### POST /auth/logout
Invalidate refresh token.

## Households
### GET /households/me
Return the current user’s household context.

Response
```json
{
  "household": {"id": "...", "name": "Home", "currency": "USD"},
  "members": [
    {"user_id": "...", "full_name": "Alex", "role": "owner"}
  ]
}
```

### POST /households/invite
Invite another user by email (creates placeholder or sends email later).

Request
```json
{ "email": "partner@example.com", "role": "member" }
```

## Profiles (Paydays)
### GET /income-profiles
Query params: `user_id` (optional; defaults to current user)

### POST /income-profiles
Request
```json
{
  "name": "Primary Job",
  "amount_cents": 250000,
  "frequency": "biweekly",
  "start_date": "2026-01-09",
  "timezone": "America/New_York"
}
```

### PATCH /income-profiles/:id
Update fields

### DELETE /income-profiles/:id
Soft delete (set `active=false`)

## Expenses
### GET /expenses
Query params: `user_id` (optional)

### POST /expenses
Request
```json
{
  "name": "Mortgage",
  "amount_cents": 180000,
  "frequency": "monthly",
  "due_day_of_month": 1,
  "start_date": "2026-01-01",
  "autopay": true,
  "user_id": null
}
```

### PATCH /expenses/:id
### DELETE /expenses/:id

## Debts
### GET /debts
Query params: `user_id` (optional)

### POST /debts
Request
```json
{
  "name": "Car Loan",
  "lender": "Bank",
  "original_principal_cents": 1800000,
  "current_balance_cents": 1200000,
  "interest_rate_apr": 6.49,
  "minimum_payment_cents": 32000,
  "due_day_of_month": 15,
  "start_date": "2025-10-01",
  "user_id": null
}
```

### PATCH /debts/:id
### DELETE /debts/:id

## Calendar
### GET /calendar
Return paydays, expenses, debt minimums, and planned payments for a date range.

Query params: `start`, `end`, `user_id` (optional)

Response
```json
{
  "range": {"start": "2026-02-01", "end": "2026-02-28"},
  "paydays": [...],
  "expenses": [...],
  "debts": [...],
  "planned_payments": [...]
}
```

## Payment Plans
### POST /payment-plans
Create or recompute a plan for a given month.

Request
```json
{
  "plan_month": "2026-02-01",
  "strategy": "avalanche",
  "extra_amount_cents": 50000
}
```

Response
```json
{
  "plan_id": "...",
  "items": [
    {"debt_id": "...", "pay_date": "2026-02-14", "amount_cents": 65000}
  ]
}
```

### GET /payment-plans
Query params: `plan_month`, `user_id` (optional)

## Dashboards
### GET /dashboard/user
Summary for current user

### GET /dashboard/home
Summary for household

Both return:
```json
{
  "income_monthly_cents": 500000,
  "expenses_monthly_cents": 250000,
  "debt_balance_cents": 3200000,
  "minimum_debt_payment_cents": 120000,
  "estimated_months_to_payoff": 24,
  "timeline": [
    {"month": "2026-02-01", "balance_cents": 3200000}
  ]
}
```

## Notes
- All endpoints require auth except register/login/refresh.
- `user_id` query params are validated against household membership.
- `DELETE` is soft-delete where relevant.
