export const formatCurrency = (cents) => {
  const amount = Number(cents || 0) / 100;
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parseCurrency = (value) => {
  if (typeof value !== 'string') {
    return Number(value || 0);
  }
  const normalized = value.replace(/[^0-9.]/g, '');
  if (!normalized) return 0;

  if (normalized.includes('.')) {
    const amount = Number.parseFloat(normalized);
    if (Number.isNaN(amount)) return 0;
    return Math.round(amount * 100);
  }

  // Treat digits-only input as cents (right-aligned entry)
  return Number.parseInt(normalized, 10) || 0;
};
