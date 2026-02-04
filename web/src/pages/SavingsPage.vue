<template>
  <div class="page">
    <header class="topbar">
      <router-link class="btn secondary" to="/overview">Back</router-link>
      <div>
        <h1>Savings</h1>
        <p>Update your current savings balance.</p>
      </div>
    </header>

    <section class="card">
      <label class="label">Current Savings Balance</label>
      <MoneyInput v-model="balance" />
      <button class="btn" @click="save">Save</button>
      <p class="muted">Stored locally for now.</p>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import MoneyInput from '../components/MoneyInput.vue';

const saved = JSON.parse(localStorage.getItem('savings') || '{"current_balance_cents":0}');
const balance = ref(saved.current_balance_cents || 0);

const save = () => {
  localStorage.setItem('savings', JSON.stringify({ current_balance_cents: balance.value }));
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 2rem;
}

.topbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
}

.card {
  background: var(--paper);
  border-radius: 18px;
  box-shadow: var(--shadow);
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
  max-width: 420px;
}

.muted {
  color: var(--muted);
  margin: 0;
}
</style>
