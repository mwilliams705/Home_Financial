import { createRouter, createWebHistory } from 'vue-router';
import AuthView from '../pages/AuthView.vue';
import VerifyEmailView from '../pages/VerifyEmailView.vue';
import OnboardingWizard from '../pages/OnboardingWizard.vue';
import TimelineDashboard from '../pages/TimelineDashboard.vue';
import FinancialOverview from '../pages/FinancialOverview.vue';
import ExpensesPage from '../pages/ExpensesPage.vue';
import DebtsPage from '../pages/DebtsPage.vue';
import SavingsPage from '../pages/SavingsPage.vue';
import PaychecksPage from '../pages/PaychecksPage.vue';
import GoalsPage from '../pages/GoalsPage.vue';
import HomePage from '../pages/HomePage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/auth', component: AuthView },
    { path: '/verify', component: VerifyEmailView },
    { path: '/onboarding', component: OnboardingWizard },
    { path: '/dashboard', component: TimelineDashboard },
    { path: '/overview', component: FinancialOverview },
    { path: '/overview/paychecks', component: PaychecksPage },
    { path: '/overview/expenses', component: ExpensesPage },
    { path: '/overview/debts', component: DebtsPage },
    { path: '/overview/savings', component: SavingsPage },
    { path: '/overview/goals', component: GoalsPage },
  ],
});
