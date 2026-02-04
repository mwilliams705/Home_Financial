<template>
  <div class="stack">
    <div v-for="(expense, index) in state.expenses" :key="index" class="card mini">
      <div class="row">
        <div>
          <label class="label">Expense Name</label>
          <input v-model="expense.name" class="input" placeholder="Rent" />
        </div>
        <div>
          <label class="label">Amount</label>
          <MoneyInput v-model="expense.amount_cents" />
        </div>
      </div>

      <div class="row">
        <div>
          <label class="label">Frequency</label>
          <select v-model="expense.frequency" class="input">
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="semimonthly">Semimonthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label class="label">Due Day (for monthly)</label>
          <input v-model="expense.due_day_of_month" class="input" type="number" min="1" max="31" />
        </div>
      </div>

      <div class="row">
        <div>
          <label class="label">Start Date</label>
          <input v-model="expense.start_date" class="input" type="date" />
        </div>
        <div>
          <label class="label">Category</label>
          <select v-model="expense.category" class="input">
            <option value="">Category</option>
            <option v-for="option in categories" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
      </div>

      <label class="toggle">
        <input v-model="expense.autopay" type="checkbox" />
        Autopay enabled
      </label>

      <button class="btn secondary" type="button" @click="remove(index)">Remove</button>
    </div>

    <button class="btn secondary" type="button" @click="add">Add Expense</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import MoneyInput from './MoneyInput.vue';

const props = defineProps({
  modelValue: { type: Object, required: true },
});

defineEmits(['update:modelValue']);

const state = computed(() => props.modelValue);
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

const add = () => {
  state.value.expenses.push({
    name: '',
    amount_cents: 0,
    frequency: 'monthly',
    due_day_of_month: 1,
    start_date: '',
    category: '',
    autopay: false,
    user_id: null,
  });
};

const remove = (index) => {
  state.value.expenses.splice(index, 1);
};

</script>

<style scoped>
.stack {
  display: grid;
  gap: 1rem;
}

.card.mini {
  padding: 1rem;
}

.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

@media (max-width: 800px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
