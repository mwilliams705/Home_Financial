import express from 'express';
import dotenv from 'dotenv';

import { pool } from './db/pool.js';
import { authRouter } from './routes/auth.js';
import { householdRouter } from './routes/households.js';
import { incomeRouter } from './routes/income-profiles.js';
import { expensesRouter } from './routes/expenses.js';
import { debtsRouter } from './routes/debts.js';
import { calendarRouter } from './routes/calendar.js';
import { paymentPlansRouter } from './routes/payment-plans.js';
import { dashboardsRouter } from './routes/dashboards.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.info('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: durationMs,
    });
  });
  next();
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('health_check_failed', { message: err.message });
    res.status(500).json({ status: 'error', message: 'db_unreachable' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/households', householdRouter);
app.use('/api/income-profiles', incomeRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/debts', debtsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/payment-plans', paymentPlansRouter);
app.use('/api/dashboard', dashboardsRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  logger.info('api_listening', { port });
});

app.use((err, _req, res, _next) => {
  logger.error('unhandled_error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'server_error' });
});
