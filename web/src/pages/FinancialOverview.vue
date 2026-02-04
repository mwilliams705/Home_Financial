<template>
  <div class="overview">
    <header class="topbar">
      <router-link class="btn secondary" to="/dashboard">Home</router-link>
      <div>
        <h1>Financial Overview</h1>
        <p>Manage your household financial items.</p>
      </div>
    </header>

    <div class="cards">
      <router-link class="card-link" to="/overview/paychecks">
        <h2>Paychecks</h2>
        <p>Income schedules and payday timing.</p>
      </router-link>
      <router-link class="card-link" to="/overview/expenses">
        <h2>Expenses</h2>
        <p>Recurring bills and monthly obligations.</p>
      </router-link>
      <router-link class="card-link" to="/overview/debts">
        <h2>Debts</h2>
        <p>Loans, credit cards, and payoff tracking.</p>
      </router-link>
      <router-link class="card-link" to="/overview/savings">
        <h2>Savings</h2>
        <p>Current savings and goals.</p>
      </router-link>
      <router-link class="card-link" to="/overview/goals">
        <h2>Savings Goals</h2>
        <p>Target balances and goal dates.</p>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.overview {
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

.cards {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.card-link {
  display: block;
  padding: 1.5rem;
  border-radius: 20px;
  background: var(--paper);
  box-shadow: var(--shadow);
  color: inherit;
}

.card-link p {
  color: var(--muted);
}
</style>
