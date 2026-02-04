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

        <div v-if="mode === 'register'" class="grid two">
          <div>
            <label class="label">Full Name</label>
            <input v-model="fullName" class="input" type="text" placeholder="Alex" />
          </div>
          <div>
            <label class="label">Household Name</label>
            <input v-model="householdName" class="input" type="text" placeholder="Home" />
          </div>
        </div>

        <button class="btn" type="submit">
          {{ mode === 'register' ? 'Create Account' : 'Sign In' }}
        </button>
      </form>

      <p v-if="message" class="message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, setAccessToken } from '../lib/api.js';

const router = useRouter();
const mode = ref('register');
const email = ref('');
const password = ref('');
const fullName = ref('');
const householdName = ref('');
const message = ref('');

const handleSubmit = async () => {
  message.value = '';
  try {
    if (mode.value === 'register') {
      const response = await api.register({
        email: email.value,
        password: password.value,
        full_name: fullName.value || undefined,
        household_name: householdName.value || undefined,
      });
      sessionStorage.setItem('fullName', fullName.value || '');
      sessionStorage.setItem('householdName', householdName.value || '');
      sessionStorage.setItem('pendingEmail', email.value);
      message.value = 'Check your email for a verification code.';
      if (response.tokens?.access) {
        setAccessToken(response.tokens.access);
        router.push('/onboarding');
      } else {
        router.push('/verify');
      }
    } else {
      const response = await api.login({ email: email.value, password: password.value });
      if (response.requires_email_verification) {
        sessionStorage.setItem('pendingEmail', email.value);
        message.value = 'Please verify your email to continue.';
        router.push('/verify');
        return;
      }
      setAccessToken(response.tokens.access);
      router.push('/dashboard');
    }
  } catch (err) {
    message.value = err.message;
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
}

.tab.active {
  background: var(--accent);
  color: white;
}

.auth-form {
  display: grid;
  gap: 0.9rem;
}

.message {
  margin-top: 1rem;
  color: var(--accent-2);
}
</style>
