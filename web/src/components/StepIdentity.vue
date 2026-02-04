<template>
  <div class="grid two">
    <div>
      <label class="label">Full Name</label>
      <input v-model="state.identity.full_name" class="input" placeholder="Alex" />
    </div>
    <div>
      <label class="label">Household Name</label>
      <input v-model="state.identity.household_name" class="input" placeholder="Home" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Object, required: true },
});

defineEmits(['update:modelValue']);

const state = computed(() => props.modelValue);
</script>
