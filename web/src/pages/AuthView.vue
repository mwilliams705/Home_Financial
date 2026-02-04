<template>
  <div class="auth">
    <div class="auth-card">
      <router-link class="back-home" to="/">← Back to Home</router-link>
      <div class="auth-header">
        <h1>Home Financial</h1>
        <p>Build a clear, shared picture of your household cash flow.</p>
      </div>

      <div class="auth-tabs">
        <button :class="['tab', mode === 'register' ? 'active' : '']" @click="mode = 'register'">
          Register
        </button>
        <button :class="['tab', mode === 'login' ? 'active' : '']" @click="mode = 'login'">
          Login
        </button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label class="label">Email</label>
        <input v-model="email" class="input" type="email" placeholder="you@example.com" required />

        <label class="label">Password</label>
        <input v-model="password" class="input" type="password" placeholder="••••••••" required />

        <div v-if="mode === 'register'">
          <label class="label">Confirm Password</label>
          <input v-model="confirmPassword" class="input" type="password" placeholder="••••••••" required />
        </div>

        <div v-if="mode === 'register'" class="grid two">
          <div>
            <label class="label">First Name</label>
            <input v-model="firstName" class="input" type="text" placeholder="Alex" />
          </div>
          <div>
            <label class="label">Last Name</label>
            <input v-model="lastName" class="input" type="text" placeholder="Johnson" />
          </div>
        </div>

        <div v-if="mode === 'register'">
          <label class="label">Household Name</label>
          <input v-model="householdName" class="input" type="text" placeholder="Home" />
        </div>

        <button class="btn" type="submit">
          {{ mode === 'register' ? 'Create Account' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-actions">
        <button class="btn secondary" type="button" @click="mode = 'login'">Log In</button>
        <button class="btn secondary" type="button">Forgot Password</button>
      </div>

      <p v-if="message" class="message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, setAccessToken } from '../lib/api.js';

const router = useRouter();
const route = useRoute();
const mode = ref('register');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const firstName = ref('');
const lastName = ref('');
const householdName = ref('');
const message = ref('');

onMounted(() => {
  if (route.query.mode === 'login') {
    mode.value = 'login';
  }
});

const handleSubmit = async () => {
  message.value = '';
  try {
    const normalizedEmail = email.value.trim().toLowerCase();
    if (mode.value === 'register') {
      if (password.value !== confirmPassword.value) {
        message.value = 'Passwords do not match.';
        return;
      }
      const fullName = `${firstName.value} ${lastName.value}`.trim();
      const response = await api.register({
        email: normalizedEmail,
        password: password.value,
        full_name: fullName || undefined,
        household_name: householdName.value || undefined,
      });
      sessionStorage.setItem('fullName', fullName || '');
      sessionStorage.setItem('householdName', householdName.value || '');
      sessionStorage.setItem('pendingEmail', normalizedEmail);
      message.value = 'Check your email for a verification code.';
      if (response.tokens?.access) {
        setAccessToken(response.tokens.access);
        router.push('/onboarding');
      } else {
        router.push('/verify');
      }
    } else {
      const response = await api.login({ email: normalizedEmail, password: password.value });
      if (response.requires_email_verification) {
        sessionStorage.setItem('pendingEmail', normalizedEmail);
        message.value = 'Please verify your email to continue.';
        router.push('/verify');
        return;
      }
      setAccessToken(response.tokens.access);
      router.push('/dashboard');
    }
  } catch (err) {
    message.value = 'Unable to complete request. If you already have an account, try logging in.';
  }
};
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-card {
  width: min(480px, 100%);
  background: var(--paper);
  border-radius: 24px;
  box-shadow: var(--shadow);
  padding: 2rem;
}

.back-home {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--muted);
}

.auth-header p {
  color: var(--muted);
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f2efe9;
  border-radius: 999px;
  padding: 0.35rem;
  margin: 1.5rem 0;
}

.tab {
  background: transparent;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  color: #000;
  opacity: 0.6;
}

.tab.active {
  background: var(--accent);
  color: #000;
  opacity: 1;
}

.auth-form {
  display: grid;
  gap: 0.9rem;
}

.auth-form .btn {
  font-family: 'Noto Serif', serif;
  font-size: 1.05rem;
}

.message {
  margin-top: 1rem;
  color: var(--accent-2);
}

.auth-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  justify-content: center;
}
</style>
