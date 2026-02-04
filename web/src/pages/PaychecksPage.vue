<template>
  <div class="page">
    <header class="topbar">
      <router-link class="btn secondary" to="/overview">Back</router-link>
      <div>
        <h1>Paychecks</h1>
        <p>Manage your income profiles.</p>
      </div>
    </header>

    <section class="list">
      <div v-for="profile in profiles" :key="profile.id" class="item">
        <input v-model="profile.name" class="input" placeholder="Paycheck name" />
        <MoneyInput v-model="profile.amount_cents" />
        <select v-model="profile.frequency" class="input">
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="semimonthly">Semimonthly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input v-model="profile.start_date" class="input" type="date" />
        <input
          v-if="needsDayOfMonth(profile.frequency)"
          v-model="profile.day_of_month"
          class="input"
          type="number"
          min="1"
          max="31"
        />
        <input
          v-if="profile.frequency === 'semimonthly'"
          v-model="profile.semimonthly_days"
          class="input"
          placeholder="1,15"
        />
        <div class="actions">
          <button class="btn secondary" @click="saveProfile(profile)">Save</button>
          <button class="btn secondary" @click="removeProfile(profile)">Delete</button>
        </div>
      </div>
    </section>

    <section class="new">
      <h2>Add Paycheck</h2>
      <div class="item">
        <input v-model="newProfile.name" class="input" placeholder="New paycheck" />
        <MoneyInput v-model="newProfile.amount_cents" />
        <select v-model="newProfile.frequency" class="input">
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="semimonthly">Semimonthly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input v-model="newProfile.start_date" class="input" type="date" />
        <input
          v-if="needsDayOfMonth(newProfile.frequency)"
          v-model="newProfile.day_of_month"
          class="input"
          type="number"
          min="1"
          max="31"
        />
        <input
          v-if="newProfile.frequency === 'semimonthly'"
          v-model="newProfile.semimonthly_days"
          class="input"
          placeholder="1,15"
        />
        <button class="btn" @click="addProfile">Add</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../lib/api.js';
import MoneyInput from '../components/MoneyInput.vue';

const profiles = ref([]);
const newProfile = ref({
  name: '',
  amount_cents: 0,
  frequency: 'biweekly',
  start_date: new Date().toISOString().slice(0, 10),
  day_of_month: '',
  semimonthly_days: '',
});

const load = async () => {
  const response = await api.getIncomeProfiles();
  profiles.value = response.items.map((profile) => ({
    ...profile,
    semimonthly_days: Array.isArray(profile.semimonthly_days)
      ? profile.semimonthly_days.join(',')
      : profile.semimonthly_days || '',
  }));
};

const parseSemimonthly = (value) => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(Boolean);
};

const needsDayOfMonth = (frequency) => ['monthly', 'quarterly', 'yearly'].includes(frequency);

const saveProfile = async (profile) => {
  await api.updateIncomeProfile(profile.id, {
    name: profile.name,
    amount_cents: Number(profile.amount_cents || 0),
    frequency: profile.frequency,
    start_date: profile.start_date,
    day_of_month: profile.day_of_month ? Number(profile.day_of_month) : undefined,
    semimonthly_days: parseSemimonthly(profile.semimonthly_days),
  });
  await load();
};

const removeProfile = async (profile) => {
  await api.deleteIncomeProfile(profile.id);
  await load();
};

const addProfile = async () => {
  await api.createIncomeProfile({
    name: newProfile.value.name,
    amount_cents: Number(newProfile.value.amount_cents || 0),
    frequency: newProfile.value.frequency,
    start_date: newProfile.value.start_date,
    day_of_month: newProfile.value.day_of_month ? Number(newProfile.value.day_of_month) : undefined,
    semimonthly_days: parseSemimonthly(newProfile.value.semimonthly_days),
  });
  newProfile.value = {
    name: '',
    amount_cents: 0,
    frequency: 'biweekly',
    start_date: new Date().toISOString().slice(0, 10),
    day_of_month: '',
    semimonthly_days: '',
  };
  await load();
};

onMounted(load);
</script>

<style scoped>
.page {
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

.list {
  display: grid;
  gap: 1rem;
}

.item {
  display: grid;
  gap: 0.75rem;
  background: var(--paper);
  padding: 1rem;
  border-radius: 18px;
  box-shadow: var(--shadow);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.new {
  margin-top: 2rem;
}
</style>
