<template>
  <input
    class="input"
    :value="display"
    inputmode="decimal"
    @focus="handleFocus"
    @input="handleInput"
    @blur="handleBlur"
  />
</template>

<script setup>
import { ref, watch } from 'vue';
import { formatCurrency, parseCurrency } from '../lib/money.js';

const props = defineProps({
  modelValue: { type: Number, default: 0 },
});

const emit = defineEmits(['update:modelValue']);

const display = ref(formatCurrency(props.modelValue));
const isFocused = ref(false);

const handleInput = (event) => {
  const value = event.target.value;
  const cents = parseCurrency(value);
  emit('update:modelValue', cents);
  display.value = value;
};

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  isFocused.value = false;
  display.value = formatCurrency(props.modelValue);
};

watch(
  () => props.modelValue,
  (next) => {
    if (!isFocused.value) {
      display.value = formatCurrency(next);
    }
  }
);
</script>
