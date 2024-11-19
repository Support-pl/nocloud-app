<template>
  <custom-addons />
</template>

<script setup>
import customAddons from '@/components/cloud/create/customAddons.vue'

defineProps({
  mode: { type: String, required: true },
  plans: { type: Array, required: true },
  products: { type: Array, required: true },
  productSize: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false }
})
</script>

<script>
export default { name: 'IoneAddonsPanel' }
</script>
