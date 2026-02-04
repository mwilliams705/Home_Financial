<template>
  <div class="verify">
    <div class="card">
      <h1>Verify Your Email</h1>
      <p>Enter the 6-digit code we emailed to {{ email || 'your inbox' }}.</p>

      <form class="form" @submit.prevent="handleVerify">
        <label class="label">Verification Code</label>
        <input v-model="code" class="input" type="text" placeholder="123456" required maxlength="6" />
        <button class="btn" type="submit">Verify</button>
      </form>

      <button class="btn secondary" @click="handleResend">Resend Code</button>
      <p v-if="message" class="message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, setAccessToken } from '../lib/api.js';

const router = useRouter();
const email = ref(sessionStorage.getItem('pendingEmail') || '');
const code = ref('');
const message = ref('');

const handleVerify = async () => {
  message.value = '';
  try {
    const response = await api.verifyEmailCode({ email: email.value, code: code.value });
    if (response.tokens?.access) {
      setAccessToken(response.tokens.access);
      router.push('/onboarding');
      return;
    }
    message.value = 'Verified. Please log in.';
    router.push('/auth');
  } catch (err) {
    message.value = err.message;
  }
};

const handleResend = async () => {
  message.value = '';
  try {
    await api.requestEmailCode({ email: email.value });
    message.value = 'New code sent.';
  } catch (err) {
    message.value = err.message;
  }
};
</script>

<style scoped>
.verify {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.card {
  width: min(480px, 100%);
}

.form {
  display: grid;
  gap: 0.9rem;
  margin: 1.5rem 0;
}

.message {
  margin-top: 1rem;
  color: var(--accent-2);
}
</style>
