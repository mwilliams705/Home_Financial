-- Core schema for financial planning app
-- Uses UUIDs and stores money as integer cents.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$ BEGIN
  CREATE TYPE frequency AS ENUM ('weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_role AS ENUM ('owner', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('scheduled', 'extra');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Households ("Home" dashboards)
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  share_code CHAR(6) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);

-- Compensation / income profiles (shown as Pay Days on calendar)
CREATE TABLE IF NOT EXISTS income_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  frequency frequency NOT NULL,
  start_date DATE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  day_of_month SMALLINT CHECK (day_of_month BETWEEN 1 AND 31),
  semimonthly_days SMALLINT[] CHECK (array_length(semimonthly_days, 1) = 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS income_profiles_household_idx ON income_profiles(household_id);
CREATE INDEX IF NOT EXISTS income_profiles_user_idx ON income_profiles(user_id);

-- Monthly expenses and other recurring bills
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  category TEXT,
  frequency frequency NOT NULL,
  due_day_of_month SMALLINT CHECK (due_day_of_month BETWEEN 1 AND 31),
  start_date DATE NOT NULL,
  end_date DATE,
  autopay BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS expenses_household_idx ON expenses(household_id);
CREATE INDEX IF NOT EXISTS expenses_user_idx ON expenses(user_id);

-- Debts (loans, credit cards, etc.)
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  lender TEXT,
  original_principal_cents BIGINT NOT NULL CHECK (original_principal_cents >= 0),
  current_balance_cents BIGINT NOT NULL CHECK (current_balance_cents >= 0),
  interest_rate_apr NUMERIC(7,4) NOT NULL CHECK (interest_rate_apr >= 0),
  promo_rate_apr NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (promo_rate_apr >= 0),
  promo_rate_end_date DATE,
  compounding TEXT NOT NULL DEFAULT 'monthly',
  minimum_payment_cents BIGINT NOT NULL CHECK (minimum_payment_cents >= 0),
  due_day_of_month SMALLINT CHECK (due_day_of_month BETWEEN 1 AND 31),
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS debts_household_idx ON debts(household_id);
CREATE INDEX IF NOT EXISTS debts_user_idx ON debts(user_id);

-- Planned payments for a given month (supports optimal payment plans)
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_month DATE NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'avalanche',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id, plan_month)
);

CREATE TABLE IF NOT EXISTS payment_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  pay_date DATE NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0)
);

CREATE INDEX IF NOT EXISTS payment_plan_items_plan_idx ON payment_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS payment_plan_items_debt_idx ON payment_plan_items(debt_id);

-- Actual payments recorded (optional but useful later)
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pay_date DATE NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  payment_type payment_type NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debt_payments_debt_idx ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS debt_payments_household_idx ON debt_payments(household_id);

-- Email verification codes
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_verification_codes_user_idx ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS email_verification_codes_email_idx ON email_verification_codes(email);
