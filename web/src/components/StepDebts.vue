<template>
  <div class="stack">
    <div v-for="(debt, index) in state.debts" :key="index" class="card mini">
      <div class="row">
        <div>
          <label class="label">Debt Name</label>
          <input v-model="debt.name" class="input" placeholder="Credit Card" />
        </div>
        <div>
          <label class="label">Lender</label>
          <input v-model="debt.lender" class="input" placeholder="Bank" />
        </div>
      </div>

      <div class="row">
        <div>
          <label class="label">Current Balance</label>
          <MoneyInput v-model="debt.current_balance_cents" />
        </div>
        <div>
          <label class="label">Minimum Payment</label>
          <MoneyInput v-model="debt.minimum_payment_cents" />
        </div>
      </div>

      <div class="row">
        <div>
          <label class="label">Interest APR (%)</label>
          <input v-model="debt.interest_rate_apr" class="input" type="number" min="0" step="0.01" />
        </div>
        <div class="toggle-group">
          <label class="label">Promo APR?</label>
          <label class="toggle">
            <input v-model="debt.has_promo" type="checkbox" />
            Enable promo rate
          </label>
        </div>
      </div>

      <div class="row">
        <div v-if="debt.has_promo">
          <label class="label">Promo APR (%)</label>
          <input v-model="debt.promo_rate_apr" class="input" type="number" min="0" step="0.01" />
        </div>
        <div v-if="debt.has_promo">
          <label class="label">Promo End Date</label>
          <input v-model="debt.promo_rate_end_date" class="input" type="date" />
        </div>
        <div>
          <label class="label">Due Day of Month</label>
          <input v-model="debt.due_day_of_month" class="input" type="number" min="1" max="31" />
        </div>
      </div>

      <div class="row">
        <div>
          <label class="label">Original Principal</label>
          <MoneyInput v-model="debt.original_principal_cents" />
        </div>
        <div>
          <label class="label">Start Date</label>
          <input v-model="debt.start_date" class="input" type="date" />
        </div>
      </div>

      <button class="btn secondary" type="button" @click="remove(index)">Remove</button>
    </div>

    <button class="btn secondary" type="button" @click="add">Add Debt</button>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import MoneyInput from './MoneyInput.vue';

const props = defineProps({
  modelValue: { type: Object, required: true },
});

defineEmits(['update:modelValue']);

const state = computed(() => props.modelValue);

const add = () => {
  state.value.debts.push({
    name: '',
    lender: '',
    original_principal_cents: 0,
    current_balance_cents: 0,
    interest_rate_apr: 0,
    promo_rate_apr: 0,
    promo_rate_end_date: '',
    minimum_payment_cents: 0,
    due_day_of_month: 1,
    start_date: '',
    user_id: null,
    has_promo: false,
  });
};

const applyPromoToggle = () => {
  state.value.debts.forEach((debt) => {
    if (!debt.has_promo) {
      debt.promo_rate_apr = 0;
      debt.promo_rate_end_date = '';
    }
  });
};

watch(
  () => state.value.debts.map((debt) => debt.has_promo),
  () => applyPromoToggle(),
  { deep: true }
);

const remove = (index) => {
  state.value.debts.splice(index, 1);
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

.toggle-group {
  display: grid;
  gap: 0.4rem;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 800px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
