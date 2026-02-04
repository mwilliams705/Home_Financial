<template>
  <div class="home">
    <nav class="nav">
      <div class="brand">Home Financial</div>
      <div class="nav-actions">
        <router-link class="btn secondary" to="/auth?mode=login">Log In</router-link>
        <router-link class="btn" to="/auth">Get Started</router-link>
      </div>
    </nav>

    <header class="hero">
      <div class="hero-content">
        <p class="eyebrow">Household Finance, Made Visual</p>
        <h1 class="headline">Home Financial</h1>
        <p class="lead">
          A timeline-first financial planner that maps your paydays, bills, debts, and savings
          into one shared household view.
        </p>
        <div class="cta">
          <router-link class="btn" to="/auth">Get Started</router-link>
          <router-link class="btn secondary" to="/auth">Log In</router-link>
        </div>
      </div>
      <div class="hero-panel">
        <div class="panel-card">
          <img class="panel-image" alt="Stacked cash" src="https://images.unsplash.com/photo-1544378730-8b5104b18790?auto=format&fit=crop&w=900&q=80" />
          <h2>See Your Month at a Glance</h2>
          <p>
            Track paychecks, expenses, and debt payoff plans on a scrolling timeline built
            for real life.
          </p>
        </div>
        <div class="panel-card accent">
          <img class="panel-image small" alt="Money and notebook" src="https://images.unsplash.com/photo-1504691342899-a6df5a25832e?auto=format&fit=crop&w=900&q=80" />
          <h2>Shared Household View</h2>
          <p>Invite your partner with a 6-digit code and plan together.</p>
        </div>
      </div>
    </header>

    <section class="split">
      <div class="split-text">
        <p class="eyebrow">Timeline-First</p>
        <h2>See every paycheck in context</h2>
        <p>
          We map paychecks against obligations, debt payoff goals, and savings so you always know
          what the next step should be.
        </p>
      </div>
      <img
        class="split-image"
        alt="Wallet and cash"
        src="https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1000&q=80"
      />
    </section>

    <section class="split reverse">
      <img
        class="split-image"
        alt="Financial planning with notebook"
        src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=80"
      />
      <div class="split-text">
        <p class="eyebrow">Smart Payoff</p>
        <h2>Debt plans that adapt</h2>
        <p>
          Our schedules prioritize interest rates and promotional APR windows to keep you ahead
          of the curve.
        </p>
      </div>
    </section>

    <section class="split">
      <div class="split-text">
        <p class="eyebrow">Shared & Private</p>
        <h2>Household and personal views</h2>
        <p>
          Keep your own financial view while collaborating on a shared household plan. Everything
          stays aligned in one place.
        </p>
      </div>
      <img
        class="split-image"
        alt="Counting money"
        src="https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=1000&q=80"
      />
    </section>

    <section class="cta-section">
      <h2>Ready to map your finances?</h2>
      <p>Start building your household timeline in minutes.</p>
      <router-link class="btn" to="/auth">Create Your Account</router-link>
    </section>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  padding: 2rem 3rem 4rem;
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.brand {
  font-weight: 700;
  letter-spacing: 0.05rem;
}

.nav-actions {
  display: flex;
  gap: 1rem;
}

.hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.5rem;
  align-items: center;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2rem;
  font-size: 0.75rem;
  color: var(--muted);
  margin: 0 0 1rem;
}

.headline {
  font-size: clamp(3rem, 6vw, 5rem);
  margin-bottom: 1rem;
}

.lead {
  font-size: 1.1rem;
  color: var(--muted);
  max-width: 520px;
}

.cta {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.hero-panel {
  display: grid;
  gap: 1rem;
}

.panel-card {
  background: var(--paper);
  border-radius: 22px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  display: grid;
  gap: 1rem;
}

.panel-card.accent {
  background: color-mix(in srgb, var(--accent-2) 20%, var(--paper));
}

.panel-image {
  width: 100%;
  max-height: 160px;
  object-fit: contain;
  border-radius: 16px;
}

.panel-image.small {
  max-height: 120px;
}

.split {
  margin-top: 4rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  align-items: center;
}

.split.reverse {
  direction: rtl;
}

.split.reverse > * {
  direction: ltr;
}

.split-text p {
  color: var(--muted);
}

.split-image {
  width: 100%;
  border-radius: 24px;
  object-fit: cover;
  max-height: 320px;
  box-shadow: var(--shadow);
}

.cta-section {
  margin-top: 4rem;
  padding: 2.5rem;
  border-radius: 24px;
  background: color-mix(in srgb, var(--accent) 12%, var(--paper));
  display: grid;
  gap: 1rem;
  text-align: center;
  box-shadow: var(--shadow);
}

@media (max-width: 700px) {
  .home {
    padding: 1.5rem;
  }

  .cta {
    flex-direction: column;
  }

  .nav {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
