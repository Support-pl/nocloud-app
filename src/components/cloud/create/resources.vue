<template>
  <transition
    v-for="(item, key) in items"
    :key="key"
    name="networkApear"
  >
    <a-row
      v-if="item.visible ?? true"
      justify="space-between"
      style="font-size: 1.2rem"
      :style="item.style"
    >
      <a-col>{{ capitalize(item.title) }}:</a-col>
      <a-col>{{ item.value }}</a-col>
    </a-row>
  </transition>
</template>

<script setup>
defineProps({
  items: { type: Object, required: true }
})
</script>

<script>
export default { name: 'CloudResources' }
</script>
