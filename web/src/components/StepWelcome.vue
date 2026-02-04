<template>
  <div class="welcome">
    <h2>Welcome, {{ firstName }}</h2>
    <p>
      You are setting up <strong>{{ householdName }}</strong>. We'll walk through paychecks,
      recurring expenses, debts, current savings, and goals to build your timeline.
    </p>
    <div class="steps">
      <div>1. Paychecks</div>
      <div>2. Monthly expenses</div>
      <div>3. Debts</div>
      <div>4. Current savings</div>
      <div>5. Savings goals</div>
    </div>
  </div>
</template>

<script setup>
const rawName = sessionStorage.getItem('fullName') || '';
const rawHousehold = sessionStorage.getItem('householdName') || 'your household';
const firstName = rawName.split(' ')[0] || 'there';
const householdName = rawHousehold || 'your household';
</script>

<style scoped>
.welcome {
  display: grid;
  gap: 1rem;
}

.steps {
  display: grid;
  gap: 0.4rem;
  color: var(--muted);
}
</style>
