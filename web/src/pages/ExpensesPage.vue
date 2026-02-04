<template>
  <div class="page">
    <header class="topbar">
      <router-link class="btn secondary" to="/overview">Back</router-link>
      <div>
        <h1>Expenses</h1>
        <p>Manage recurring expenses for your household.</p>
      </div>
    </header>

    <section class="list">
      <div v-for="expense in expenses" :key="expense.id" class="item">
        <input v-model="expense.name" class="input" placeholder="Expense name" />
        <MoneyInput v-model="expense.amount_cents" />
        <input v-model="expense.frequency" class="input" placeholder="monthly" />
        <select v-model="expense.category" class="input">
          <option value="">Category</option>
          <option v-for="option in categories" :key="option" :value="option">{{ option }}</option>
        </select>
        <input v-model="expense.due_day_of_month" class="input" type="number" min="1" max="31" />
        <input v-model="expense.start_date" class="input" type="date" />
        <div class="actions">
          <button class="btn secondary" @click="saveExpense(expense)">Save</button>
          <button class="btn secondary" @click="removeExpense(expense)">Delete</button>
        </div>
      </div>
    </section>

    <section class="new">
      <h2>Add Expense</h2>
      <div class="item">
        <input v-model="newExpense.name" class="input" placeholder="New expense" />
        <MoneyInput v-model="newExpense.amount_cents" />
        <select v-model="newExpense.frequency" class="input">
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="semimonthly">Semimonthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
        <select v-model="newExpense.category" class="input">
          <option value="">Category</option>
          <option v-for="option in categories" :key="option" :value="option">{{ option }}</option>
        </select>
        <input v-model="newExpense.due_day_of_month" class="input" type="number" min="1" max="31" />
        <input v-model="newExpense.start_date" class="input" type="date" />
        <button class="btn" @click="addExpense">Add</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../lib/api.js';
import MoneyInput from '../components/MoneyInput.vue';

const expenses = ref([]);
const categories = [
  'Housing',
  'Utilities',
  'Groceries',
  'Transportation',
  'Insurance',
  'Healthcare',
  'Debt',
  'Subscriptions',
  'Childcare',
  'Education',
  'Entertainment',
  'Misc',
];
const newExpense = ref({
  name: '',
  amount_cents: 0,
  frequency: 'monthly',
  category: '',
  due_day_of_month: 1,
  start_date: new Date().toISOString().slice(0, 10),
});

const load = async () => {
  const response = await api.getExpenses();
  expenses.value = response.items;
};

const saveExpense = async (expense) => {
  await api.updateExpense(expense.id, {
    name: expense.name,
    amount_cents: Number(expense.amount_cents || 0),
    frequency: expense.frequency,
    due_day_of_month: Number(expense.due_day_of_month || 1),
    start_date: expense.start_date,
    category: expense.category || null,
  });
  await load();
};

const removeExpense = async (expense) => {
  await api.deleteExpense(expense.id);
  await load();
};

const addExpense = async () => {
  await api.createExpense({
    name: newExpense.value.name,
    amount_cents: Number(newExpense.value.amount_cents || 0),
    frequency: newExpense.value.frequency,
    category: newExpense.value.category || null,
    due_day_of_month: Number(newExpense.value.due_day_of_month || 1),
    start_date: newExpense.value.start_date,
    user_id: null,
  });
  newExpense.value = {
    name: '',
    amount_cents: 0,
    frequency: 'monthly',
    category: '',
    due_day_of_month: 1,
    start_date: new Date().toISOString().slice(0, 10),
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

.actions {
  display: flex;
  gap: 0.5rem;
}

.new {
  margin-top: 2rem;
}
</style>
