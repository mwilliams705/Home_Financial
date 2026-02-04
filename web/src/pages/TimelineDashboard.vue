<template>
  <div class="dashboard">
    <header class="topbar">
      <button class="menu-btn" @click="menuOpen = true">☰</button>
      <div>
        <h1>Cash Flow Timeline</h1>
        <p>{{ monthLabel }}</p>
      </div>
      <div class="scope-toggle">
        <button class="btn secondary" :class="{ active: scope === 'household' }" @click="setScope('household')">
          Household
        </button>
        <button class="btn secondary" :class="{ active: scope === 'user' }" @click="setScope('user')">
          My View
        </button>
      </div>
    </header>

    <div class="timeline">
      <div class="zero-line"></div>
      <div ref="scrollRef" class="chart-scroll">
        <div class="day-strip">
          <div v-for="day in days" :key="day.date" class="day-cell">
            <div class="dow">{{ day.dow }}</div>
            <div class="dom">{{ day.dom }}</div>
          </div>
        </div>
        <svg
          v-if="chartPoints.length"
          class="chart"
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          :width="chartWidth"
          :height="chartHeight"
        >
          <line
            :x1="0"
            :x2="chartWidth"
            :y1="chartHeight / 2"
            :y2="chartHeight / 2"
            class="axis"
          />
          <path :d="savingsPath" class="line savings" />
          <path :d="cashPath" class="line cash" />
          <path :d="debtPath" class="line debt" />
          <g v-for="point in chartPoints" :key="point.date">
            <g v-if="point.payday" class="payday-group">
              <circle :cx="point.x" :cy="point.cashY" r="6" class="dot payday" />
              <text :x="point.x + 8" :y="point.cashY - 12" class="label">
                {{ formatMoney(point.payday.amount_cents) }}
              </text>
              <foreignObject
                :x="point.x - 80"
                :y="point.cashY - 110"
                width="160"
                height="90"
                class="tooltip-wrap"
              >
                <div class="tooltip">
                  <strong>{{ point.payday.date }}</strong>
                  <div>Paycheck {{ formatMoney(point.payday.amount_cents) }}</div>
                  <div>Planned outflow {{ formatMoney(point.payday.outflow_cents) }}</div>
                </div>
              </foreignObject>
            </g>
          </g>
        </svg>
      </div>
    </div>

    <div class="legend">
      <div><span class="dot positive"></span>Cash flow</div>
      <div><span class="dot negative"></span>Debt balance</div>
      <div><span class="dot accent"></span>Savings</div>
      <div><span class="dot muted"></span>Paydays</div>
    </div>

    <div class="inspector">
      <div class="info-icon">i</div>
      <div class="info-panel">
        <h3>Upcoming Paydays</h3>
        <div v-for="payday in upcomingPaydays" :key="payday.date" class="info-row">
          <strong>{{ payday.date }}</strong>
          <span>{{ formatMoney(payday.amount_cents) }}</span>
          <span class="muted">Outflow {{ formatMoney(payday.outflow_cents) }}</span>
        </div>
      </div>
    </div>

    <button v-if="showBackToToday" class="back-today" @click="scrollToToday">
      ← Today
    </button>

    <div v-if="menuOpen" class="menu-overlay" @click.self="menuOpen = false">
      <div class="menu">
        <h2>Menu</h2>
        <div class="menu-list">
          <router-link class="menu-item" to="/dashboard" @click="menuOpen = false">
            <strong>Dashboard</strong>
            <span>View your timeline</span>
          </router-link>
          <button class="menu-item toggle" type="button" @click="toggleOverview">
            <strong>Financial Overview</strong>
            <span>Manage expenses, debts, savings</span>
          </button>
          <div v-if="overviewOpen" class="submenu">
            <router-link class="submenu-item" to="/overview/paychecks" @click="menuOpen = false">
              Paychecks
            </router-link>
            <router-link class="submenu-item" to="/overview/expenses" @click="menuOpen = false">
              Expenses
            </router-link>
            <router-link class="submenu-item" to="/overview/debts" @click="menuOpen = false">
              Debts
            </router-link>
            <router-link class="submenu-item" to="/overview/savings" @click="menuOpen = false">
              Savings
            </router-link>
            <router-link class="submenu-item" to="/overview/goals" @click="menuOpen = false">
              Savings Goals
            </router-link>
          </div>
        </div>
        <div class="theme-picker">
          <label class="label">Theme</label>
          <select v-model="theme" class="input" @change="applyTheme">
            <option value="theme1-light">Cherry Blossom · Light</option>
            <option value="theme1-dark">Cherry Blossom · Dark</option>
            <option value="theme2-light">Thistle Slate · Light</option>
            <option value="theme2-dark">Thistle Slate · Dark</option>
            <option value="theme3-light">Amethyst Saffron · Light</option>
            <option value="theme3-dark">Amethyst Saffron · Dark</option>
            <option value="theme4-light">Lavender Evergreen · Light</option>
            <option value="theme4-dark">Lavender Evergreen · Dark</option>
            <option value="theme5-light">Baltic Horizon · Light</option>
            <option value="theme5-dark">Baltic Horizon · Dark</option>
            <option value="theme6-light">Forest Porcelain · Light</option>
            <option value="theme6-dark">Forest Porcelain · Dark</option>
            <option value="theme7-light">Fern Mist · Light</option>
            <option value="theme7-dark">Fern Mist · Dark</option>
          </select>
        </div>
        <div class="menu-footer">
          <button class="menu-item small" type="button" @click="showShare = !showShare">
            Household Share Code
            <span>{{ household?.share_code || 'Not set' }}</span>
          </button>
          <div v-if="showShare" class="share-card">
            <div class="share-code">{{ household?.share_code || '------' }}</div>
            <p class="muted">Share this 6-digit code to add household members.</p>
          </div>
        </div>
        <button class="menu-close" @click="menuOpen = false">✕</button>
        <button class="menu-logout" @click="logout">Logout</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../lib/api.js';

const menuOpen = ref(false);
const overviewOpen = ref(false);
const paydays = ref([]);
const days = ref([]);
const chartPoints = ref([]);
const savingsInput = ref(0);
const chartWidth = ref(1200);
const chartHeight = ref(420);
const theme = ref(document.documentElement.dataset.theme || 'theme1-light');
const household = ref(null);
const scope = ref('household');
const showShare = ref(false);
const scrollRef = ref(null);
const showBackToToday = ref(false);

const now = new Date();
const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);

const formatMoney = (cents) => {
  const dollars = Number(cents || 0) / 100;
  return dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const buildSchedule = ({ paydaysData, expensesData, debtsData, startDate, endDate, initialDebt, currentSavings }) => {
  const paydayList = [...paydaysData].sort((a, b) => a.date.localeCompare(b.date));
  const expenses = [...expensesData].sort((a, b) => a.date.localeCompare(b.date));
  const debts = [...debtsData].sort((a, b) => a.date.localeCompare(b.date));

  const assignToPaycheck = (items, accessor) => {
    items.forEach((item) => {
      const due = item.date;
      const target = paydayList
        .slice()
        .reverse()
        .find((payday) => payday.date <= due) || paydayList[0];
      if (!target) return;
      target.outflows.push({
        type: item.type,
        name: item.name,
        amount_cents: accessor(item),
        debt_id: item.debt_id || null,
      });
    });
  };

  paydayList.forEach((payday) => {
    payday.outflows = [];
    payday.outflow_cents = 0;
  });

  assignToPaycheck(expenses.map((item) => ({ ...item, type: 'expense' })), (item) =>
    Number(item.amount_cents || 0)
  );
  assignToPaycheck(debts.map((item) => ({ ...item, type: 'debt' })), (item) =>
    Number(item.minimum_payment_cents || 0)
  );

  let cashBalance = 0;
  let savingsBalance = currentSavings;
  let debtBalance = initialDebt;
  const debtBalances = debts.map((debt) => ({
    id: debt.debt_id || debt.id,
    name: debt.name,
    balance: Number(debt.current_balance_cents || 0),
    interest_rate_apr: Number(debt.interest_rate_apr || 0),
    promo_rate_apr: Number(debt.promo_rate_apr || 0),
    promo_rate_end_date: debt.promo_rate_end_date,
  }));

  const paydayPoints = paydayList.map((payday, index) => {
    const inflow = Number(payday.amount_cents || 0);
    const outflow = payday.outflows.reduce((sum, item) => sum + Number(item.amount_cents || 0), 0);
    payday.outflow_cents = outflow;

    cashBalance += inflow - outflow;
    const debtPayments = payday.outflows
      .filter((item) => item.type === 'debt')
      .reduce((sum, item) => sum + Number(item.amount_cents || 0), 0);
    debtBalance = Math.max(0, debtBalance - debtPayments);

    const extraCash = Math.max(0, cashBalance);
    if (extraCash > 0 && debtBalances.length > 0) {
      const paydayDate = new Date(payday.date);
      const effectiveRate = (debt) => {
        if (!debt.promo_rate_end_date) return debt.interest_rate_apr;
        const promoEnd = new Date(debt.promo_rate_end_date);
        if (!Number.isNaN(promoEnd.getTime()) && promoEnd >= paydayDate) {
          return debt.promo_rate_apr;
        }
        return debt.interest_rate_apr;
      };

      const target = debtBalances.reduce((best, debt) =>
        effectiveRate(debt) > effectiveRate(best) ? debt : best
      );
      const extraPayment = Math.min(extraCash, target.balance);
      target.balance -= extraPayment;
      debtBalance = Math.max(0, debtBalance - extraPayment);
      cashBalance -= extraPayment;
    }

    if (cashBalance > 0) {
      savingsBalance += cashBalance * 0.2;
      cashBalance *= 0.8;
    }

    return {
      index,
      date: payday.date,
      cashBalance,
      savingsBalance,
      debtBalance,
      payday,
    };
  });

  return { paydayList, paydayPoints };
};

const buildDays = (start, end) => {
  const result = [];
  const cursor = new Date(start.getTime());
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  while (cursor <= end) {
    result.push({
      date: cursor.toISOString().slice(0, 10),
      dow: formatter.format(cursor),
      dom: cursor.getDate(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

const buildChart = (dailyPoints) => {
  const dayWidth = 52;
  const width = Math.max(1200, dailyPoints.length * dayWidth);
  const height = 420;
  const padding = 40;
  const maxCash = Math.max(1, ...dailyPoints.map((p) => p.cashBalance));
  const maxDebt = Math.max(1, ...dailyPoints.map((p) => p.debtBalance));
  const maxSavings = Math.max(1, ...dailyPoints.map((p) => p.savingsBalance));

  return dailyPoints.map((point, idx) => {
    const x = padding + idx * dayWidth;
    const cashY = height / 2 - (point.cashBalance / maxCash) * (height / 2 - padding);
    const debtY = height / 2 + (point.debtBalance / maxDebt) * (height / 2 - padding);
    const savingsY = height / 2 - (point.savingsBalance / maxSavings) * (height / 2 - padding);
    return {
      ...point,
      x,
      cashY,
      debtY,
      savingsY,
    };
  });
};

const loadTimeline = async () => {
  const start = new Date(Date.UTC(now.getUTCFullYear() - 2, now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(Date.UTC(now.getUTCFullYear() + 5, now.getUTCMonth(), now.getUTCDate()));
  const calendar = await api.getCalendar({
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    user_id: scope.value === 'user' ? household.value?.current_user_id : undefined,
  });
  const savedSavings = JSON.parse(localStorage.getItem('savings') || '{"current_balance_cents":0}');
  savingsInput.value = savedSavings.current_balance_cents || 0;

  const initialDebt = calendar.debts.reduce(
    (sum, debt) => sum + Number(debt.current_balance_cents || 0),
    0
  );

  const { paydayList, paydayPoints } = buildSchedule({
    paydaysData: calendar.paydays,
    expensesData: calendar.expenses,
    debtsData: calendar.debts,
    startDate: start,
    endDate: end,
    initialDebt,
    currentSavings: savingsInput.value,
  });

  paydays.value = paydayList;
  const dayList = buildDays(start, end);
  days.value = dayList;
  const paydayMap = new Map(paydayPoints.map((point) => [point.date, point]));
  const dailyPoints = [];
  let lastPoint = {
    cashBalance: 0,
    savingsBalance: savingsInput.value,
    debtBalance: initialDebt,
    payday: null,
  };
  dayList.forEach((day, index) => {
    const match = paydayMap.get(day.date);
    if (match) {
      lastPoint = { ...match };
      dailyPoints.push({ ...match, index, date: day.date });
      return;
    }
    dailyPoints.push({
      index,
      date: day.date,
      cashBalance: lastPoint.cashBalance,
      savingsBalance: lastPoint.savingsBalance,
      debtBalance: lastPoint.debtBalance,
      payday: null,
    });
  });

  const chart = buildChart(dailyPoints);
  chartPoints.value = chart;
  chartWidth.value = Math.max(1200, chart.length * 52);
  chartHeight.value = 420;

  requestAnimationFrame(() => {
    scrollToToday();
    attachScrollWatcher();
  });
};

onMounted(async () => {
  const householdResponse = await api.getHousehold();
  household.value = householdResponse.household;
  household.value.current_user_id = householdResponse.current_user_id;
  await loadTimeline();
});

const applyTheme = () => {
  document.documentElement.dataset.theme = theme.value;
  localStorage.setItem('theme', theme.value);
};

const toggleOverview = () => {
  overviewOpen.value = !overviewOpen.value;
};

const setScope = async (nextScope) => {
  scope.value = nextScope;
  await loadTimeline();
};

const scrollToToday = () => {
  if (!scrollRef.value || !days.value.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const index = days.value.findIndex((day) => day.date === today);
  if (index === -1) return;
  const dayWidth = 52;
  const padding = 40;
  const target = padding + index * dayWidth - scrollRef.value.clientWidth / 2;
  scrollRef.value.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  showBackToToday.value = false;
};

const attachScrollWatcher = () => {
  if (!scrollRef.value || scrollRef.value._listenerAttached) return;
  const dayWidth = 52;
  const padding = 40;
  scrollRef.value._listenerAttached = true;
  scrollRef.value.addEventListener('scroll', () => {
    const today = new Date().toISOString().slice(0, 10);
    const index = days.value.findIndex((day) => day.date === today);
    if (index === -1) return;
    const todayOffset = padding + index * dayWidth;
    showBackToToday.value = scrollRef.value.scrollLeft > todayOffset;
  });
};

const logout = () => {
  localStorage.removeItem('theme');
  sessionStorage.removeItem('pendingEmail');
  localStorage.removeItem('logLevel');
  localStorage.removeItem('accessToken');
  window.location.href = '/auth';
};

const cashPath = computed(() => {
  if (!chartPoints.value.length) return '';
  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.cashY}`)
    .join(' ');
});

const debtPath = computed(() => {
  if (!chartPoints.value.length) return '';
  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.debtY}`)
    .join(' ');
});

const savingsPath = computed(() => {
  if (!chartPoints.value.length) return '';
  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.savingsY}`)
    .join(' ');
});

const upcomingPaydays = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return paydays.value.filter((payday) => payday.date >= today).slice(0, 6);
});
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.scope-toggle {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}

.scope-toggle .btn.active {
  background: var(--accent);
  color: white;
}

.topbar p {
  margin: 0.25rem 0 0;
  color: var(--muted);
}

.menu-btn {
  border: none;
  background: transparent;
  color: var(--accent-2);
  border-radius: 12px;
  padding: 0.4rem 0.6rem;
  font-size: 1.4rem;
  cursor: pointer;
}

.timeline {
  position: relative;
  margin-top: 2rem;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.zero-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: var(--line);
  z-index: 0;
}

.chart-scroll {
  overflow-x: auto;
  padding-bottom: 1.5rem;
  position: relative;
  mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
  flex: 1;
}

.day-strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 52px;
  gap: 0.35rem;
  padding: 0.5rem 0 1rem;
}

.day-cell {
  text-align: center;
  opacity: 0.8;
}

.day-cell .dow {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--muted);
}

.day-cell .dom {
  font-weight: 600;
}

.chart {
  display: block;
  height: 100%;
}

.axis {
  stroke: var(--line);
  stroke-width: 2;
}

.line {
  fill: none;
  stroke-width: 3;
}

.line.cash {
  stroke: var(--positive);
}

.line.debt {
  stroke: var(--negative);
}

.line.savings {
  stroke: var(--accent-2);
}

.dot.payday {
  fill: var(--accent-2);
  stroke: white;
  stroke-width: 2;
}

.payday-group:hover .tooltip {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.tooltip-wrap {
  overflow: visible;
}

.tooltip {
  background: var(--paper);
  color: var(--ink);
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  box-shadow: var(--shadow);
  font-size: 0.75rem;
  display: grid;
  gap: 0.25rem;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.15s ease, transform 0.15s ease;
  pointer-events: none;
}

.label {
  fill: var(--muted);
  font-size: 12px;
}

.muted {
  color: var(--muted);
  font-size: 0.9rem;
}

.legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
  color: var(--muted);
}

.inspector {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: grid;
  justify-items: center;
  gap: 0.5rem;
}

.back-today {
  position: fixed;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: var(--paper);
  color: var(--ink);
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  box-shadow: var(--shadow);
  cursor: pointer;
}

.info-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-2);
  color: white;
  display: grid;
  place-items: center;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow);
}

.info-panel {
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.15s ease, transform 0.15s ease;
  pointer-events: none;
  background: var(--paper);
  color: var(--ink);
  padding: 0.75rem;
  border-radius: 16px;
  box-shadow: var(--shadow);
  min-width: 240px;
  display: grid;
  gap: 0.5rem;
}

.inspector:hover .info-panel {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.info-row {
  display: grid;
  gap: 0.2rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--line);
}

.menu-list {
  display: grid;
  gap: 0.75rem;
  margin: 1rem 0 1.5rem;
}

.menu-item {
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem 0.9rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  color: inherit;
  text-align: left;
  border: none;
}

.menu-item span {
  color: var(--muted);
  font-size: 0.9rem;
}

.submenu {
  display: grid;
  gap: 0.5rem;
  padding-left: 0.75rem;
}

.submenu-item {
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
}

.menu-footer {
  margin-top: 1rem;
  margin-bottom: 3.5rem;
  display: grid;
  gap: 0.5rem;
}

.menu-item.small {
  font-size: 0.85rem;
  padding: 0.6rem 0.75rem;
}

.share-card {
  background: rgba(255, 255, 255, 0.12);
  padding: 0.75rem;
  border-radius: 12px;
  display: grid;
  gap: 0.4rem;
}

.share-code {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.35rem;
  text-align: center;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.dot.positive {
  background: var(--positive);
}

.dot.negative {
  background: var(--negative);
}

.dot.accent {
  background: var(--accent-2);
}

.dot.muted {
  background: #8f8b86;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 80%, #000 20%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.menu {
  background: color-mix(in srgb, var(--bg) 80%, #000 20%);
  padding: 3rem 2.5rem;
  border-radius: 0;
  width: 100%;
  height: 100%;
  box-shadow: none;
  position: relative;
}

.menu-close {
  position: absolute;
  top: 24px;
  left: 24px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 1.2rem;
  cursor: pointer;
}

.menu-logout {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--ink);
  font-size: 0.9rem;
  padding: 0.7rem 1.2rem;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: var(--shadow);
}

.menu li span {
  display: block;
  color: var(--muted);
  font-size: 0.9rem;
}

.theme-picker {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 900px) {
  .dashboard {
    padding: 1.5rem;
  }

  .day {
    min-height: 360px;
  }
}
</style>
