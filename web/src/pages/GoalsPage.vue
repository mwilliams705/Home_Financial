<template>
  <div class="page">
    <header class="topbar">
      <router-link class="btn secondary" to="/overview">Back</router-link>
      <div>
        <h1>Savings Goals</h1>
        <p>Track goals you can add later.</p>
      </div>
    </header>

    <section class="list">
      <div v-for="(goal, index) in goals" :key="index" class="item">
        <input v-model="goal.name" class="input" placeholder="Goal name" />
        <MoneyInput v-model="goal.target_cents" />
        <input v-model="goal.target_date" class="input" type="date" />
        <div class="actions">
          <button class="btn secondary" @click="saveGoals">Save</button>
          <button class="btn secondary" @click="removeGoal(index)">Delete</button>
        </div>
      </div>
    </section>

    <section class="new">
      <h2>Add Goal</h2>
      <div class="item">
        <input v-model="newGoal.name" class="input" placeholder="New goal" />
        <MoneyInput v-model="newGoal.target_cents" />
        <input v-model="newGoal.target_date" class="input" type="date" />
        <button class="btn" @click="addGoal">Add</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import MoneyInput from '../components/MoneyInput.vue';

const stored = JSON.parse(localStorage.getItem('goals') || '[]');
const goals = ref(stored);
const newGoal = ref({
  name: '',
  target_cents: 0,
  target_date: new Date().toISOString().slice(0, 10),
});

const saveGoals = () => {
  localStorage.setItem('goals', JSON.stringify(goals.value));
};

const addGoal = () => {
  goals.value.push({ ...newGoal.value });
  newGoal.value = {
    name: '',
    target_cents: 0,
    target_date: new Date().toISOString().slice(0, 10),
  };
  saveGoals();
};

const removeGoal = (index) => {
  goals.value.splice(index, 1);
  saveGoals();
};
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
