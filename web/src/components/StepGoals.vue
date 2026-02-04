<template>
  <div class="stack">
    <div v-for="(goal, index) in state.goals" :key="index" class="card mini">
      <div class="row">
        <div>
          <label class="label">Goal Name</label>
          <input v-model="goal.name" class="input" placeholder="Emergency Fund" />
        </div>
        <div>
          <label class="label">Target Amount</label>
          <MoneyInput v-model="goal.target_cents" />
        </div>
      </div>

      <div class="row">
        <div>
          <label class="label">Target Date</label>
          <input v-model="goal.target_date" class="input" type="date" />
        </div>
      </div>

      <button class="btn secondary" type="button" @click="remove(index)">Remove</button>
    </div>

    <button class="btn secondary" type="button" @click="add">Add Goal</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import MoneyInput from './MoneyInput.vue';

const props = defineProps({
  modelValue: { type: Object, required: true },
});

defineEmits(['update:modelValue']);

const state = computed(() => props.modelValue);

const add = () => {
  state.value.goals.push({
    name: '',
    target_cents: 0,
    target_date: '',
  });
};

const remove = (index) => {
  state.value.goals.splice(index, 1);
};

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
