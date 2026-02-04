<template>
  <div>
    <label class="label">Current Savings Balance</label>
    <MoneyInput v-model="state.savings.current_balance_cents" />
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

</script>
