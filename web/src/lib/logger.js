const levels = ['debug', 'info', 'warn', 'error'];
const currentLevel = (localStorage.getItem('logLevel') || 'info').toLowerCase();
const currentIndex = levels.indexOf(currentLevel);

const shouldLog = (level) => levels.indexOf(level) >= currentIndex;

const log = (level, message, meta) => {
  if (!shouldLog(level)) return;
  const timestamp = new Date().toISOString();
  const payload = meta ? [message, meta] : [message];
  console[level](`[${timestamp}] [${level.toUpperCase()}]`, ...payload);
};

export const logger = {
  debug(message, meta) {
    log('debug', message, meta);
  },
  info(message, meta) {
    log('info', message, meta);
  },
  warn(message, meta) {
    log('warn', message, meta);
  },
  error(message, meta) {
    log('error', message, meta);
  },
};
