import { logger } from './logger.js';

let accessToken = localStorage.getItem('accessToken') || '';

export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

async function request(path, options = {}) {
  const start = performance.now();
  const headers = options.headers || {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  const duration = Math.round(performance.now() - start);
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  logger.info('api_response', {
    method: options.method || 'GET',
    path,
    status: response.status,
    duration_ms: duration,
  });
  if (!response.ok) {
    const error = new Error(data.error || 'request_failed');
    error.details = data.details || null;
    logger.error('api_error', { path, status: response.status, error: error.message });
    throw error;
  }
  return data;
}

export const api = {
  register(payload) {
    return request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  login(payload) {
    return request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  requestEmailCode(payload) {
    return request('/api/auth/request-email-code', { method: 'POST', body: JSON.stringify(payload) });
  },
  verifyEmailCode(payload) {
    return request('/api/auth/verify-email-code', { method: 'POST', body: JSON.stringify(payload) });
  },
  createIncomeProfile(payload) {
    return request('/api/income-profiles', { method: 'POST', body: JSON.stringify(payload) });
  },
  getIncomeProfiles() {
    return request('/api/income-profiles');
  },
  updateIncomeProfile(id, payload) {
    return request(`/api/income-profiles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  deleteIncomeProfile(id) {
    return request(`/api/income-profiles/${id}`, { method: 'DELETE' });
  },
  createExpense(payload) {
    return request('/api/expenses', { method: 'POST', body: JSON.stringify(payload) });
  },
  createDebt(payload) {
    return request('/api/debts', { method: 'POST', body: JSON.stringify(payload) });
  },
  createPaymentPlan(payload) {
    return request('/api/payment-plans', { method: 'POST', body: JSON.stringify(payload) });
  },
  getCalendar(params) {
    const filtered = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const query = new URLSearchParams(filtered).toString();
    return request(`/api/calendar?${query}`);
  },
  getHousehold() {
    return request('/api/households/me');
  },
  joinHousehold(payload) {
    return request('/api/households/join', { method: 'POST', body: JSON.stringify(payload) });
  },
  getDebts() {
    return request('/api/debts');
  },
  updateDebt(id, payload) {
    return request(`/api/debts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  deleteDebt(id) {
    return request(`/api/debts/${id}`, { method: 'DELETE' });
  },
  getExpenses() {
    return request('/api/expenses');
  },
  updateExpense(id, payload) {
    return request(`/api/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  deleteExpense(id) {
    return request(`/api/expenses/${id}`, { method: 'DELETE' });
  },
};
