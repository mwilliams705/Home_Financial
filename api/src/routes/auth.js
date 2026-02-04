import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

import { pool } from '../db/pool.js';
import { signAccessToken } from '../utils/jwt.js';
import { sendVerificationCode } from '../utils/email.js';
import { logger } from '../utils/logger.js';

export const authRouter = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1).optional(),
  household_name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const emailCodeSchema = z.object({
  email: z.string().email(),
});

const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
});

const emailAuthEnabled = String(process.env.EMAIL_AUTH_ENABLED || 'false').toLowerCase() === 'true';

const createCode = () => {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  return { code, hash };
};

const saveVerificationCode = async ({ client, userId, email, codeHash }) => {
  await client.query(
    `insert into email_verification_codes (user_id, email, code_hash, expires_at)
     values ($1, $2, $3, now() + interval '15 minutes')`,
    [userId, email, codeHash]
  );
};

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const { password, full_name, household_name } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  const client = await pool.connect();
  try {
    await client.query('begin');

    const existing = await client.query('select id from users where email = $1', [normalizedEmail]);
    if (existing.rowCount > 0) {
      await client.query('rollback');
      return res.status(409).json({ error: 'email_exists' });
    }

    const userResult = await client.query(
      `insert into users (email, password_hash, full_name)
       values ($1, $2, $3)
       returning id, email, full_name, email_verified`,
      [normalizedEmail, passwordHash, full_name || null]
    );

    let household = null;
    if (household_name) {
      const shareCode = String(Math.floor(100000 + Math.random() * 900000));
      const householdResult = await client.query(
        'insert into households (name, currency, share_code) values ($1, $2, $3) returning id, name, currency, share_code',
        [household_name, 'USD', shareCode]
      );
      household = householdResult.rows[0];

      await client.query(
        'insert into household_members (household_id, user_id, role) values ($1, $2, $3)',
        [household.id, userResult.rows[0].id, 'owner']
      );
    }

    await client.query('commit');

    if (emailAuthEnabled) {
      const { code, hash } = createCode();
      const codeClient = await pool.connect();
      try {
        await saveVerificationCode({
          client: codeClient,
          userId: userResult.rows[0].id,
          email: normalizedEmail,
          codeHash: hash,
        });
      } finally {
        codeClient.release();
      }

      await sendVerificationCode({ to: normalizedEmail, code });

      return res.status(201).json({
        user: userResult.rows[0],
        household,
        requires_email_verification: true,
      });
    }

    await pool.query('update users set email_verified = true where id = $1', [userResult.rows[0].id]);
    const token = signAccessToken({
      user_id: userResult.rows[0].id,
      email: userResult.rows[0].email,
    });

    return res.status(201).json({
      user: userResult.rows[0],
      household,
      tokens: { access: token },
      requires_email_verification: false,
    });
  } catch (err) {
    logger.error('register_error', { message: err.message, stack: err.stack });
    await client.query('rollback');
    return res.status(500).json({ error: 'server_error' });
  } finally {
    client.release();
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const { password } = parsed.data;
  const normalizedEmail = parsed.data.email.toLowerCase();
  let result;
  try {
    result = await pool.query(
      'select id, email, full_name, password_hash, email_verified from users where email = $1',
      [normalizedEmail]
    );
  } catch (err) {
    logger.error('login_query_error', { message: err.message, stack: err.stack });
    return res.status(500).json({ error: 'server_error' });
  }
  if (result.rowCount === 0) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const user = result.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  if (emailAuthEnabled && !user.email_verified) {
    return res.json({ requires_email_verification: true });
  }

  const token = signAccessToken({
    user_id: user.id,
    email: user.email,
  });

  return res.json({ tokens: { access: token } });
});

// Refresh and logout placeholders
authRouter.post('/refresh', (_req, res) => {
  return res.status(501).json({ error: 'not_implemented' });
});

authRouter.post('/logout', (_req, res) => {
  return res.status(501).json({ error: 'not_implemented' });
});

authRouter.post('/request-email-code', async (req, res) => {
  if (!emailAuthEnabled) {
    return res.json({ status: 'disabled' });
  }
  const parsed = emailCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const userResult = await pool.query('select id from users where email = $1', [normalizedEmail]);
  if (userResult.rowCount === 0) {
    return res.json({ status: 'ok' });
  }

  const { code, hash } = createCode();
  try {
  await saveVerificationCode({
    client: pool,
    userId: userResult.rows[0].id,
    email: normalizedEmail,
    codeHash: hash,
  });
  await sendVerificationCode({ to: normalizedEmail, code });
  } catch (err) {
    logger.error('request_email_code_error', { message: err.message, stack: err.stack });
    return res.status(500).json({ error: 'server_error' });
  }

  return res.json({ status: 'ok' });
});

authRouter.post('/verify-email-code', async (req, res) => {
  if (!emailAuthEnabled) {
    return res.json({ status: 'disabled' });
  }
  const parsed = verifyCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const { code } = parsed.data;
  const normalizedEmail = parsed.data.email.toLowerCase();
  let userResult;
  try {
    userResult = await pool.query('select id, email from users where email = $1', [normalizedEmail]);
  } catch (err) {
    logger.error('verify_email_user_query_error', { message: err.message, stack: err.stack });
    return res.status(500).json({ error: 'server_error' });
  }
  if (userResult.rowCount === 0) {
    return res.status(401).json({ error: 'invalid_code' });
  }

  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  let codeResult;
  try {
    codeResult = await pool.query(
    `select id from email_verification_codes
     where user_id = $1
       and email = $2
       and code_hash = $3
         and used_at is null
         and expires_at > now()
       order by created_at desc
       limit 1`,
    [userResult.rows[0].id, normalizedEmail, codeHash]
  );
  } catch (err) {
    logger.error('verify_email_code_query_error', { message: err.message, stack: err.stack });
    return res.status(500).json({ error: 'server_error' });
  }

  if (codeResult.rowCount === 0) {
    return res.status(401).json({ error: 'invalid_code' });
  }

  try {
    await pool.query('update email_verification_codes set used_at = now() where id = $1', [
      codeResult.rows[0].id,
    ]);
    await pool.query('update users set email_verified = true where id = $1', [
      userResult.rows[0].id,
    ]);
  } catch (err) {
    logger.error('verify_email_update_error', { message: err.message, stack: err.stack });
    return res.status(500).json({ error: 'server_error' });
  }

  const token = signAccessToken({
    user_id: userResult.rows[0].id,
    email: normalizedEmail,
  });

  return res.json({ tokens: { access: token } });
});
