<template>
  <div style="display: flex">
    <a-select
      :disabled="disabled"
      style="width: 100px"
      :value="code"
      @change="emits('update:code', $event)"
      show-search
      :options="filtredCountries"
      :filter-option="searchCountries"
    >
    </a-select>
    <a-input
      :disabled="disabled"
      :status="status"
      :value="number"
      @update:value="emits('update:number', $event)"
      name="phone"
      :placeholder="`${capitalize($t('clientinfo.phone number'))} *`"
      maxlength="18"
    />
  </div>
</template>

<script setup>
import { computed, ref, toRefs, watch } from "vue";
import countries from "@/assets/countries.json";

const props = defineProps({
  number: { type: String, required: true },
  code: { type: String, required: true },
  disabled: { type: Boolean, default: false },
});
const { number } = toRefs(props);

const emits = defineEmits(["update:code", "update:number"]);

const status = ref("");

const filtredCountries = computed(() => {
  const map = new Map();
  countries.forEach((c) => map.set(c.dial_code, c));

  return [...map.values()].map((v) => ({
    value: v.dial_code,
    label: v.dial_code,
  }));
});

const validateNumber = (value) => {
  if (!value || value.length < 6 || value.length > 16 || !/^\d+$/.test(value)) {
    return "error";
  }

  return "";
};

watch(number, (value) => {
  status.value = validateNumber(value);
});
</script>