import { defineStore } from 'pinia';

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    identity: {
      full_name: '',
      household_name: '',
    },
    paychecks: [
      {
        name: 'Primary Paycheck',
        frequency: 'biweekly',
        start_date: '',
        day_of_month: '',
        amount_cents: 0,
      },
    ],
    expenses: [],
    debts: [],
    savings: {
      current_balance_cents: 0,
    },
    goals: [],
  }),
});
