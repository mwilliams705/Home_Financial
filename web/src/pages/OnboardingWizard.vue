<template>
  <div class="wizard">
    <div class="wizard-shell">
      <header>
        <h1>Set Up Your Home</h1>
        <p>{{ steps[stepIndex].subtitle }}</p>
        <div class="progress">
          <div class="bar" :style="{ width: progress + '%' }"></div>
        </div>
      </header>

      <section class="panel">
        <component
          :is="steps[stepIndex].component"
          v-model="formState"
          class="step"
        />
      </section>

      <footer class="actions">
        <button class="btn secondary" @click="prevStep" :disabled="stepIndex === 0">Back</button>
        <button class="btn" @click="nextStep">
          {{ stepIndex === steps.length - 1 ? 'Finish' : 'Next' }}
        </button>
      </footer>

      <p v-if="message" class="message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useOnboardingStore } from '../store/onboarding.js';
import { api } from '../lib/api.js';
import StepWelcome from '../components/StepWelcome.vue';
import StepPaychecks from '../components/StepPaychecks.vue';
import StepExpenses from '../components/StepExpenses.vue';
import StepDebts from '../components/StepDebts.vue';
import StepSavings from '../components/StepSavings.vue';
import StepGoals from '../components/StepGoals.vue';

const router = useRouter();
const store = useOnboardingStore();
const stepIndex = ref(0);
const message = ref('');

const steps = [
  { component: StepWelcome, subtitle: 'Let’s map the journey together.' },
  { component: StepPaychecks, subtitle: 'Add your paychecks so we can map cash flow.' },
  { component: StepExpenses, subtitle: 'Track the expenses that return every month.' },
  { component: StepDebts, subtitle: 'Add your debts so we can build a payoff plan.' },
  { component: StepSavings, subtitle: 'Capture your current savings balance.' },
  { component: StepGoals, subtitle: 'Set savings goals for the future.' },
];

const formState = ref(store.$state);

const progress = computed(() => ((stepIndex.value + 1) / steps.length) * 100);

const prevStep = () => {
  if (stepIndex.value > 0) stepIndex.value -= 1;
};

const nextStep = async () => {
  message.value = '';
  if (stepIndex.value < steps.length - 1) {
    stepIndex.value += 1;
    return;
  }

  try {
    await Promise.all(
      formState.value.paychecks.map((paycheck) =>
        api.createIncomeProfile({
          name: paycheck.name,
          amount_cents: Number(paycheck.amount_cents) || 0,
          frequency: paycheck.frequency,
          start_date: paycheck.start_date,
          day_of_month: paycheck.day_of_month ? Number(paycheck.day_of_month) : undefined,
          semimonthly_days: paycheck.semimonthly_days || undefined,
          timezone: paycheck.timezone || 'America/New_York',
        })
      )
    );

    await Promise.all(
      formState.value.expenses.map((expense) =>
        api.createExpense({
          name: expense.name,
          amount_cents: Number(expense.amount_cents) || 0,
          frequency: expense.frequency,
          due_day_of_month: expense.due_day_of_month ? Number(expense.due_day_of_month) : undefined,
          start_date: expense.start_date,
          category: expense.category || undefined,
          autopay: expense.autopay || false,
          user_id: expense.user_id || null,
        })
      )
    );

    await Promise.all(
      formState.value.debts.map((debt) =>
        api.createDebt({
          name: debt.name,
          lender: debt.lender || undefined,
          original_principal_cents: Number(debt.original_principal_cents) || 0,
          current_balance_cents: Number(debt.current_balance_cents) || 0,
          interest_rate_apr: Number(debt.interest_rate_apr) || 0,
          minimum_payment_cents: Number(debt.minimum_payment_cents) || 0,
          due_day_of_month: debt.due_day_of_month ? Number(debt.due_day_of_month) : undefined,
          start_date: debt.start_date,
          user_id: debt.user_id || null,
        })
      )
    );

    await api.createPaymentPlan({
      plan_month: new Date().toISOString().slice(0, 10),
      strategy: 'avalanche',
      extra_amount_cents: 0,
    });

    localStorage.setItem(
      'savings',
      JSON.stringify({
        current_balance_cents: Number(formState.value.savings.current_balance_cents || 0),
      })
    );

    router.push('/dashboard');
  } catch (err) {
    message.value = err.message;
  }
};
</script>

<style scoped>
.wizard {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.wizard-shell {
  width: min(900px, 100%);
  background: var(--paper);
  border-radius: 28px;
  box-shadow: var(--shadow);
  padding: 2rem 2.5rem;
}

header p {
  color: var(--muted);
}

.progress {
  height: 6px;
  background: #efe9e1;
  border-radius: 999px;
  margin-top: 1rem;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  border-radius: 999px;
}

.panel {
  margin-top: 2rem;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.message {
  margin-top: 1rem;
  color: var(--accent-2);
}
</style>
