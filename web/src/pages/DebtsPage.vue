<template>
  <div class="page">
    <header class="topbar">
      <router-link class="btn secondary" to="/overview">Back</router-link>
      <div>
        <h1>Debts</h1>
        <p>Manage debts and payoff details.</p>
      </div>
    </header>

    <section class="list">
      <div v-for="debt in debts" :key="debt.id" class="item">
        <input v-model="debt.name" class="input" placeholder="Debt name" />
        <MoneyInput v-model="debt.current_balance_cents" />
        <MoneyInput v-model="debt.minimum_payment_cents" />
        <input v-model="debt.interest_rate_apr" class="input" type="number" min="0" step="0.01" />
        <label class="toggle">
          <input v-model="debt.has_promo" type="checkbox" />
          Promo APR?
        </label>
        <input
          v-if="debt.has_promo"
          v-model="debt.promo_rate_apr"
          class="input"
          type="number"
          min="0"
          step="0.01"
        />
        <input
          v-if="debt.has_promo"
          v-model="debt.promo_rate_end_date"
          class="input"
          type="date"
        />
        <input v-model="debt.due_day_of_month" class="input" type="number" min="1" max="31" />
        <div class="actions">
          <button class="btn secondary" @click="saveDebt(debt)">Save</button>
          <button class="btn secondary" @click="removeDebt(debt)">Delete</button>
        </div>
      </div>
    </section>

    <section class="new">
      <h2>Add Debt</h2>
      <div class="item">
        <input v-model="newDebt.name" class="input" placeholder="New debt" />
        <MoneyInput v-model="newDebt.current_balance_cents" />
        <MoneyInput v-model="newDebt.minimum_payment_cents" />
        <input v-model="newDebt.interest_rate_apr" class="input" type="number" min="0" step="0.01" />
        <label class="toggle">
          <input v-model="newDebt.has_promo" type="checkbox" />
          Promo APR?
        </label>
        <input
          v-if="newDebt.has_promo"
          v-model="newDebt.promo_rate_apr"
          class="input"
          type="number"
          min="0"
          step="0.01"
        />
        <input
          v-if="newDebt.has_promo"
          v-model="newDebt.promo_rate_end_date"
          class="input"
          type="date"
        />
        <input v-model="newDebt.due_day_of_month" class="input" type="number" min="1" max="31" />
        <button class="btn" @click="addDebt">Add</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../lib/api.js';
import MoneyInput from '../components/MoneyInput.vue';

const debts = ref([]);
const newDebt = ref({
  name: '',
  current_balance_cents: 0,
  minimum_payment_cents: 0,
  interest_rate_apr: 0,
  promo_rate_apr: 0,
  promo_rate_end_date: '',
  due_day_of_month: 1,
  has_promo: false,
});

const load = async () => {
  const response = await api.getDebts();
  debts.value = response.items.map((debt) => ({
    ...debt,
    has_promo: Boolean(debt.promo_rate_apr || debt.promo_rate_end_date),
  }));
};

const saveDebt = async (debt) => {
  await api.updateDebt(debt.id, {
    name: debt.name,
    current_balance_cents: Number(debt.current_balance_cents || 0),
    minimum_payment_cents: Number(debt.minimum_payment_cents || 0),
    interest_rate_apr: Number(debt.interest_rate_apr || 0),
    promo_rate_apr: debt.has_promo ? Number(debt.promo_rate_apr || 0) : 0,
    promo_rate_end_date: debt.has_promo ? debt.promo_rate_end_date || null : null,
    due_day_of_month: Number(debt.due_day_of_month || 1),
    start_date: debt.start_date || new Date().toISOString().slice(0, 10),
  });
  await load();
};

const removeDebt = async (debt) => {
  await api.deleteDebt(debt.id);
  await load();
};

const addDebt = async () => {
  await api.createDebt({
    name: newDebt.value.name,
    lender: null,
    original_principal_cents: Number(newDebt.value.current_balance_cents || 0),
    current_balance_cents: Number(newDebt.value.current_balance_cents || 0),
    interest_rate_apr: Number(newDebt.value.interest_rate_apr || 0),
    minimum_payment_cents: Number(newDebt.value.minimum_payment_cents || 0),
    promo_rate_apr: newDebt.value.has_promo ? Number(newDebt.value.promo_rate_apr || 0) : 0,
    promo_rate_end_date: newDebt.value.has_promo ? newDebt.value.promo_rate_end_date || null : null,
    due_day_of_month: Number(newDebt.value.due_day_of_month || 1),
    start_date: new Date().toISOString().slice(0, 10),
    user_id: null,
  });
  newDebt.value = {
    name: '',
    current_balance_cents: 0,
    minimum_payment_cents: 0,
    interest_rate_apr: 0,
    promo_rate_apr: 0,
    promo_rate_end_date: '',
    due_day_of_month: 1,
    has_promo: false,
  };
  await load();
};

onMounted(load);
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

.topbar p {
  margin: 0.25rem 0 0;
  color: var(--muted);
}

.list {
  display: grid;
  gap: 1rem;
}

.item {
  display: grid;
  gap: 0.75rem;
  background: var(--paper);
  padding: 1rem;
  border-radius: 18px;
  box-shadow: var(--shadow);
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.new {
  margin-top: 2rem;
}
</style>
