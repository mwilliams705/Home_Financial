import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router/index.js';
import './assets/base.css';
import { logger } from './lib/logger.js';

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
} else if (!document.documentElement.dataset.theme) {
  document.documentElement.dataset.theme = 'theme7-dark';
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');

window.addEventListener('error', (event) => {
  logger.error('window_error', { message: event.message, filename: event.filename, lineno: event.lineno });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('unhandled_rejection', { reason: event.reason });
});
