const levels = ['debug', 'info', 'warn', 'error'];
const currentLevel = process.env.LOG_LEVEL || 'info';
const currentIndex = levels.indexOf(currentLevel);

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (!meta) return base;
  return `${base} ${JSON.stringify(meta)}`;
};

const shouldLog = (level) => levels.indexOf(level) >= currentIndex;

export const logger = {
  debug(message, meta) {
    if (!shouldLog('debug')) return;
    console.debug(formatMessage('debug', message, meta));
  },
  info(message, meta) {
    if (!shouldLog('info')) return;
    console.info(formatMessage('info', message, meta));
  },
  warn(message, meta) {
    if (!shouldLog('warn')) return;
    console.warn(formatMessage('warn', message, meta));
  },
  error(message, meta) {
    if (!shouldLog('error')) return;
    console.error(formatMessage('error', message, meta));
  },
};
