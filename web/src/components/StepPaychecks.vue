<template>
  <div class="stack">
    <div v-for="(paycheck, index) in state.paychecks" :key="index" class="card mini">
      <div class="row">
        <div>
          <label class="label">Paycheck Name</label>
          <input v-model="paycheck.name" class="input" placeholder="Primary Paycheck" />
        </div>
        <div>
          <label class="label">Amount</label>
          <MoneyInput v-model="paycheck.amount_cents" />
        </div>
      </div>

      <div class="row">
        <div>
          <label class="label">Frequency</label>
          <select v-model="paycheck.frequency" class="input">
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="semimonthly">Semimonthly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label class="label">Start Date</label>
          <input v-model="paycheck.start_date" class="input" type="date" />
        </div>
      </div>

      <div class="row">
        <div v-if="needsDayOfMonth(paycheck.frequency)">
          <label class="label">Day of Month (for monthly)</label>
          <input v-model="paycheck.day_of_month" class="input" type="number" min="1" max="31" />
        </div>
        <div v-if="paycheck.frequency === 'semimonthly'">
          <label class="label">Semimonthly Days</label>
          <input v-model="paycheck.semimonthly_days" class="input" placeholder="1,15" />
        </div>
      </div>

      <button class="btn secondary" type="button" @click="remove(index)" v-if="state.paychecks.length > 1">
        Remove Paycheck
      </button>
    </div>

    <button class="btn secondary" type="button" @click="add">Add Another Paycheck</button>
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
  state.value.paychecks.push({
    name: 'Additional Paycheck',
    frequency: 'monthly',
    start_date: '',
    day_of_month: '',
    amount_cents: 0,
  });
};

const remove = (index) => {
  state.value.paychecks.splice(index, 1);
};

const needsDayOfMonth = (frequency) => ['monthly', 'quarterly', 'yearly'].includes(frequency);


watch(
  () => state.value.paychecks,
  (value) => {
    value.forEach((paycheck) => {
      if (typeof paycheck.semimonthly_days === 'string') {
        paycheck.semimonthly_days = paycheck.semimonthly_days
          .split(',')
          .map((d) => Number(d.trim()))
          .filter(Boolean);
      }
    });
  },
  { deep: true }
);
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

@media (max-width: 800px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
